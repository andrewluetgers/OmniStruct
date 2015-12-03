// for webpack to compile css
require('../styles.js').webpackStylesBootstrap();

var React =         require('react'),
    RR =            require('react-router'),
    history =       require('history/lib/createBrowserHistory')(),
    reactDom =      require('react-dom'),
    omni = 	        require('omnistate'),
    operations =	require('./operations/operations');


var debug = false,
    initialState = {};

omni.init(operations, topDownRender, initialState, debug);
// !! don't load any view components before this point !!

// can now access our state container and api
var state = omni.state;

// expose state for easy debugging
window.state = state;

// for more interesting applications initial state configuration above will not suffice
// you will want to break up initial state and various state methods into multiple files.
// other modules can access the state container by importing omni and calling getState()
// but these components need to be initialized after omni.init is called
require('./state/alpha/alpha').init();


// configure router provide the top-down render fn used above
var {Router, Route, IndexRoute, Link} = RR;

// parent route for all others, provides route state to the state container
var App = React.createClass({
	render() {
		// store route information on state
		state.set('route', {
			location: this.props.location,
			params: this.props.params,
			routeParams: this.props.routeParams
		});

		return this.props.children;
	}
});

// basic example
var Index = React.createClass({
	render() {
		return (
			<Link to="/base">Alpha</Link>
		);
	}
});

var Log = require('./OmniStateTools/OmniStateTools.jsx');

function topDownRender() {
	reactDom.render((
		<div id="appMain">
			<Router history={history}>
				<Route path="/" component={App}>
					<IndexRoute component={Index}/>
					<Route path={"/base"} component={require('./view/Base/Base.jsx')}/>
				</Route>
			</Router>
			<Log />
		</div>
	), document.getElementById('app'));
}

// initial render
topDownRender();