var fs = require('fs'),
		path = require('path'),
		config;
try {
	config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json')));
	config.listen = config.listen;
} catch (e) {
	console.error('Error loading configuration: ', e);
	process.exit(1);
}

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

io.configure('production', function(){
	io.set('log level', 0);
}).configure('development', function(){
	io.set('log level', 3);
});

app.use('/', express.static(__dirname + '/public'));
console.info('Listening on: ' + config.listen);
server.listen(config.listen);

var _ = require('underscore');
var when = require('when');
var request = require('request')
	.defaults({
		json:true,
		auth: {
			user:config.teamcity.user,
			pass:config.teamcity.pass
		}
	});

var getBuildTypes = function(){
	var deferred = when.defer();
	request.get(
		config.teamcity.host + '/httpAuth/app/rest/buildTypes',
		function(err, res, body){
			if(err) { deferred.reject(err); return; }
			deferred.resolve(body.buildType);
	});
	return deferred.promise;
};

var getLastBuildFor = function(type){
	var build = {
			name: type.name,
			project: type.projectName,
			status: 'unknown'
	};
	var deferred = when.defer();
	request.get(
		config.teamcity.host + type.href + '/builds?count=1',
		function(err, res, body){
			if(err) { deferred.reject(err); return; }
			build.status = body.build[0].status.toLowerCase();
			deferred.resolve(build);
		});
	return deferred.promise;
};

var refresh = function (){
	console.info('refreshing...');
	getBuildTypes().then(function(types){
		var buildPromises = _(types).map(getLastBuildFor);
		when.all(buildPromises).then(
			function success(builds){
			console.info('done');
			lastSeenBuilds = builds;
			io.sockets.emit('last-builds', lastSeenBuilds);
		}, function failure(err){
			console.error('error: ', err);
		})
		.then(function(){
			setTimeout(refresh, config.refreshInterval);
		});
	});
};

var lastSeenBuilds = [];
io.sockets.on('connection', function(socket){
	socket.emit('last-builds', lastSeenBuilds);
});
refresh();
