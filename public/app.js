angular.module('tcmonitor', []).factory('io', function(){ return io; });

var StatusController = function($scope, io){
	$scope.builds = [];
	var self = this;
	self.socket = io.connect();
	self.socket.on('last-builds', function(builds){
		console.log(builds);
		$scope.builds = builds;
		$scope.anyFailed = _.chain(builds).where(function(build){ return build.status == 'failure'; }).any().value();
		$scope.buildStatus = $scope.anyFailed ? 'failure' : 'success';
		$scope.$apply();
	});
};
StatusController.$inject = ['$scope', 'io'];
