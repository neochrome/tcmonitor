angular.module('tcmonitor', []).factory('io', function(){ return io; });

var StatusController = function($scope, io){
	$scope.builds = [];
	var self = this;
	self.socket = io.connect();
	self.socket.on('last-builds', function(builds){
		$scope.builds = builds;
		var anyFailed = _(builds).any(function(build){ return build.status == 'failure'; });
		$scope.buildStatus = anyFailed ? 'failure' : 'success';
		$scope.$apply();
	});
};
StatusController.$inject = ['$scope', 'io'];
