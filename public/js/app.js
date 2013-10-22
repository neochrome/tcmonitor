var demo = {
	off: function () { return this._toggle('off'); },
	failing: function () { return this._toggle('failing'); },
	success: function () { return this._toggle('success'); },
	unknown: function () { return this._toggle('unknown'); },
	_toggle: function (state) {
		this.active = this.builds[state].length != 0;
		this.onToggled(this.builds[state]);
		return state;
	},
  onToggle: function (fn) { this.onToggled = fn; },
	active: false,
	builds: {
		failing: [
			{ status: 'success', activity: '', label: '', name: 'a successful build' },
			{ status: 'failure', activity: '', label: '', name: 'a failing build' },
			{ status: 'unknown', activity: '', label: '', name: 'an unknown build' },
			{ status: 'failure', activity: '', label: '', name: 'another failing build' },
			{ status: 'success', activity: '', label: '', name: 'another successful build' }
		],
		success: [
			{ status: 'success', activity: '', label: '', name: 'a successful build' },
			{ status: 'unknown', activity: '', label: '', name: 'an unknown build' },
			{ status: 'success', activity: '', label: '', name: 'another successful build' }
		],
		unknown: [], off: []
	}
};

angular
.module('tcmonitor', [])
.factory('io', function () { return io; })
.factory('demo', function () { return demo; })
.controller('StatusController', ['$scope', 'io', 'demo', function ($scope, io, demo) {
	var setBuilds = function (builds) {
		$scope.builds = builds;
		var anyFailed = _(builds).any(function(build){ return build.status == 'failure'; });
		$scope.buildStatus = _(builds).any()
			? anyFailed
				? 'failure'
				: 'success'
			: 'unknown';
	};

	$scope.demo = false;
	demo.onToggle(function (builds) { setBuilds(builds); $scope.$apply(); });

	var socket = io.connect();
	socket.on('last-builds', function(builds){
		if (demo.active) return;
		setBuilds(builds);
		$scope.$apply();
	});

	setBuilds([]);
}]);
