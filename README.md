# Omnistate

* Single, centralized state container with setters and getters backed by JSON
* High performance with large state objects and high state change volume
* Views use path strings to declare what state they need (using lodash get and set)
* State is delivered to views via proxy mixins (read replica + setter) e.g. get = this.foo, set = this.setFoo(value)
* Views render independently of parents (but this does not preclude top-down)
* State change pattern-matching drives "operations" (simple controllers outside of views)
* In development/debug mode direct mutation of read-replica state is an error
* Full history API to snapshot, record and replay all state changes. e.g. time traveling, infinite undo/redo

# Usage Example
npm install from the example folder
Look at example/app/App.jsx for initialization
Also look at example/app/operations for middleware


# Motivation

OmniState has been developed over the past couple years while working on a couple fairly complex 
applications. First an Angular 1.x App and another in React. In that time I have tried to make a system
that avoids complexity, has a few simple ideas and performs well. It takes a unique approach to 
change observation, controllers, accessing state within views, how view renders are triggered.
Much effort has also been put into making sure the system performs well with large state objects and 
a high volume of state changes. Omnistate is currently benchmarked at 180 random cell updates 
per second on a 100x100 table (In safari, see example).

Basic JSON objects are used instead of immutable data-structures and state is easily accessible and updateable.
Change observation is performed by routing all changes through setters and diffing the new and old sate. 
Paths are used heavily leaveraging lodash set and get semantics. 
These paths help make the diffing more efficient by diffing only from the branch of state that has changed.
These paths are also used to declare what state a view needs which leads to three very nice things. First
the state required is fetched for you from the read-replica and made easily available as a mixin.
Second a setter as it is likely you will want to change that state.
Finally any time there are any state changes at or under that path the view will render but none of its parents will.

With OmniState you can make a complex app without this.props, this.state or defining a shouldComponentUpdate.
Obviously this is not your standard approach to react but you are not prevented from using those things. 
Although it is different I have found this approach to be very nice to work with. 
It is similar in some respects to [OM Next](https://www.youtube.com/watch?v=ByNs9TG30E8).


## Component (declarative state access)

A custom component constructor is provided which makes accessing state easy. 
It also automatically renders the component if any of it's state changes, 
bypassing the traditional top-down rendering path.
This is optional but can be a powerful tool for performance and scalability.
In worst-case scenarios rendering performance is similar to raw js. See example code.

```js
module.exports = omnistate.component("UserName", {
	proxies: {
		name: "user.name"	
	}
}, function() {
	return (<div className="userName">{this.name}</div>)
});
```
	
Our simple UserName component will now reflect any changes to user.name app state.
How about a list of users? The parent can simply redefine the path via props.

```js
module.exports = omnistate.component("Users", {
	proxies: {
		name: "users"	
	},
	userList: function(users) {
		return _.each(users, function(user, i) {
			return <li><UserName proxies={{name: "users."+i}}
		});
	}
	
}, function() {
	return <ul>{this.userList(this.users)}</ul>
});
```

Now if users[10].name is changed only that component will render. 
The ShouldComponentUpdate functions will not even be triggered for the parents or any siblings.
This can be a big win when there are many siblings or complex parents to render. 
This of course is an optional feature that can be disabled by declaring the state 
as an accessor only (no direct rendering on change) Simply prefix the proxy path with @

```js
module.exports = omnistate.component("UserName", {
	proxies: {
		name: "@user.name"
	}
}, function() {
	return (<div className="userName">{this.name}</div>)
});
```
	
The view will not force a direct render when the user.name changes. 
In practice there are few edge cases for needing this capability.
See the example code Alpha.jsx for such a case.

## Operations (simple controllers/middleware)

Views react to changes in state. But how does state itself react to 
changes in state?

The basic idea is that state-change pattern matching. Operations are simple functions paired with pattern matching expressions.
When the application state matches what an operation is looking for that
function is triggered with the new state and a diff object showing what changed.

```js
var state = require('omnistate').state;

module.exports = {
	profile: {
		changes: ['user.id'],
		operation: function(readReplica, diff) {
			// hypothetical api
			api.fetchUser(diff.user.id, function(profile) {
				state.set("user.profile", profile); 
			});
		}
	}
};
```

Now any time the user.id state changes this operation will be triggered to update the user profile.

You can express multiple changes in the changes array. In a similar way you can define required (truthy) values in a requires array;
Path strings in either the changes or requires array can be negated (did not change, is falsy) if they begin with an !.


## But is it immutable?
This work is largely inspired by practical experience developing with Immutable.js
backed application state. One of the annoyances there was the api boilerplate and
constant serialization and deserialization of application state. Omnistate provides 
views and controllers with a read-replica of the app state.
Copy-on-write process is used as all state changes go through 
setters that update the source of truth and the read replica.

The read replica is a plain JSON object, mutations to it will not trigger a state change!
So don't assign values to app state read-replicas only use the OmniState api methods for updates.
