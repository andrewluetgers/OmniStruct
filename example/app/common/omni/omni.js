
var _ =                 require('lodash'),
	ops =		    	require('../ops/ops'),
    pathEvents =        require('../pathEvents/pathEvents'),
    component = 	    require('../component/component'),
    stateContainer =    require('../stateContainer/stateContainer'),
    appState = {};


module.exports = {

	init: function(operations, topDownRender, initialState, debug) {

		// ============= component and ops respond to state changes =============

		var container = stateContainer(debug),
			eventNameSpace = "stateChange";

		_.assign(appState, container);

		// config components to access the state container
		// don't load any components before this point!!
		component.configure(container, pathEvents.subscriber(eventNameSpace), debug);

		// init our app state with the stateContainer and initial values
		container.init(initialState);

		// run operations on state change
		container.setCb(function(readReplica, diff) {

			// run operations firs
			debug && console.time('operations');
			ops(operations, readReplica, diff, eventNameSpace);
			debug && console.time('operations');

			// run a top down render if the route has changed
			if (diff.route) {
				debug && console.time('topDownRender');
				//topDownRender();
				debug && console.time('topDownRender');
			}

			// force render of individual components if they are subscribed to a state path found in diff
			debug && console.time('callMatching');
			pathEvents.callMatching(readReplica, diff, eventNameSpace);
			debug && console.timeEnd('callMatching');


		});
	},

	state: appState
};


