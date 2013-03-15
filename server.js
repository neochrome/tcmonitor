var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var config = require('./config.json');
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

var getLastBuilds = function(){
	var deferred = when.defer();
	request.get(
		config.teamcity.host + '/httpAuth/app/rest/cctray/projects.xml',
		function(err, res, body){
			if(err) {
				console.error(err, res);
				deferred.reject(err);
				return;
			}
			deferred.resolve(
				_(body.Project).map(function(project){
					return {
						activity: project.activity.toLowerCase(),
						status: project.lastBuildStatus.toLowerCase(),
						label: project.lastBuildLabel,
						name: project.name
					};
				})
			);
	});
	return deferred.promise;
};

var refresh = function (){
	console.info('refreshing...');
	getLastBuilds()
	.then(function success(builds){
		console.info('done');
		lastSeenBuilds = builds;
		io.sockets.emit('last-builds', lastSeenBuilds);
	}, console.error)
	.then(function(){
		setTimeout(refresh, config.refreshInterval);
	});
};

var lastSeenBuilds = [];
io.sockets.on('connection', function(socket){
	socket.emit('last-builds', lastSeenBuilds);
});
refresh();
