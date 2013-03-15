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

function getLastBuilds(){
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

function reschedule(){
	setTimeout(refresh, config.refreshInterval);
}

function refresh(){
	console.info('refreshing...');
	getLastBuilds()
	.then(function success(builds){
		console.info('done');
		lastSeenBuilds = builds;
	}, console.error)
	.then(function notify(){
		io.sockets.emit('last-builds', lastSeenBuilds);
	})
	.then(reschedule,reschedule); //FIX: reschedule both when successfull and on failure, awaiting when's new "settled" concept
};

var lastSeenBuilds = [];
io.sockets.on('connection', function(socket){
	socket.emit('last-builds', lastSeenBuilds);
});
refresh();
