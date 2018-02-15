---
title: Actions
---

Actions form the core of interacting with a Denali application. They are the
controller layer in the MVC architecture, taking in incoming requests,
performing business logic, and handing off to the view or serializer to send the
response.

When a request comes in, Denali's [Router](latest/guides/application/routing)
will map the method and URL to a particular Action. It will invoke the
`respond()` method on that class, which is where your application logic
lives:

```js
import ApplicationAction from './application';
import Post from '../models/post';

export default class ShowPost extends ApplicationAction {

  respond({ params }) {
    return Post.find(params.id);
  }

}
```

## The respond method

Your `respond()` method is where you perform any business logic, query the
database, invoke services such as a mailer, and more.

When you are ready to send a response to the inbound HTTP request, you can
invoke `this.render()`. In it's simplest form, it will simple respond with a
200 status code and an empty response body:

```js
this.render();
// HTTP/1.1 200 OK
```

You can customize the status code using the first argument:

```js
this.render(204)
// HTTP/1.1 204 Accepted
```

To send some data in the response body, pass that data in as the second argument:

```js
this.render(200, post);
// HTTP/1.1 200 OK
// <...serialized post...>
```

You can also pass options to the serializer layer as a third argument. Denali
doesn't care about the contents or structure of this options object - it's
handed off directly to your serializer.

```js
this.render(200, post);
// HTTP/1.1 200 OK
// <...serialized post...>
```

One scenario is common enough (respond with HTTP 200 and some data) that
Denali provides a shortcut: just return the data (or a promise that resolves
with that data) from your respond method:

```js
respond() {
  return Post.find(1);
}
// is the same as:
respond() {
  let post = Post.find(1);
  this.render(200, post);
}
```

### Actions as controllers

Actions are probably a bit different than most controllers you might be used
to. Rather than a single controller class that handles multiple different
HTTP endpoints, Actions represent just one endpoint (HTTP method + URL).

This might seem like overkill at first, but it enables powerful declarative
abstractions now that there is a 1:1 relationship between a class and
endpoint, as you'll see soon. For a deeper dive into the rationale for Actions
over traditional controllers, check out the [blog post](FIXME);

## Parameters, request body, and query strings

An inbound HTTP request carries several different types of data that you
might want to access in your action's responder method. Denali makes each of
these types of data available under a single object, passed as the sole
argument to your responder method. Combined with destructuring syntax, this
lets you quickly and easily get to the data you need:

```js
respond({ body, params, query, headers }) {
  // body - the inbound HTTP request body
  // params - parameters extracted from dynamic url segments, i.e. /posts/:id -> params.id
  // query - query params parsed from the querystring, i.e. /posts?sort=id -> query.sort === 'id'
  // headers - the HTTP headers from the request
}
```

This object passed to your `respond()` method is actually the return value of
the Parser that was used to parse the incoming request. The properties show
in the example above are the convetional ones to include, but Parsers may add
additional fields as well. For example, the JSON-API parser adds a `included`
property containing any sideloaded records sent with the primary data in the
request body.

## Filters

Actions also support the concept of before and after filters. These are methods
that run before or after your responder method. Before filters also have the
ability to render a response and abort the rest of the action handling (i.e.
skip subsequent before filters and the responder). After filters do not have this ability.

To add a filter, simply add the method name to the static `before` or `after`
array on your Action:

```js
class CreatePurchase extends Action {

  static before = [
    'authenticateUser',
    'confirmBalance'
  ];
  static after = 'trackPurchase';

  authenticateUser() {
    // makes sure the user is logged in
  }

  confirmBalance() {
    // make sure the user has money to make the purchase
  }

  trackPurchase() {
    // log the purchase in an analytics tool - we do this as an after filter
    // because there is no reason why this would block the actual purchase
  }

}
```

Filters are inherited and accumulated from parent classes and mixins. This
lets you combine and reuse sets of filters, either through a base class or a
mixin. For example, want to authenticate all requests against your API? Just
add an authentication before filter to your base ApplicationAction, and it
will run on all requests:

```js
class ApplicationAction extends Action {

  static before = [ 'authenticate' ];

  authenticate() {
    // This will run before all actions
  }

}
```

Here we can start to see the power that comes from modeling endpoints with a
single class rather than multiple endpoints per class.

Imagine we have an app where _most_ of our routes need authentication, but a
handful don't. We could use a mixin to apply authentication to only the routes
that need it:

```js
class TransferMoneyAction extends Action.mixin(Authenticate) {
}
```

But now we need to remember to include that mixin every time. Forget once, and
you've exposed your app to attackers.

Instead, lets make authentication the default, but allow actions to opt out:

```js
class ApplicationAction extends Action {

  static before = [ 'authenticate' ];

  authenticate() {
    // This allows individual actions to "opt-out" of authentication by setting
    // `protected = false;`
    if (this.protected !== false) {
      // authenticate the user
    }

  }

}
```

Here, we add authentication to our base ApplicationAction class, which all our
actions will extend from. This ensures that every action will automatically
require authentication.

But we also check the `this.protected` flag, which lets an individual action
opt out of authentication if needed, but in an explicit manner. Much better!

This example might seem a bit trivial, but it becomes more compelling as we add complexity; imagine we now need to support access based on different roles. With one-class-per-endpoint Actions, it's easy and concise:

```js
class TransferMoney extends ApplicationAction {

  allowedRoles = [ 'admin', 'owner' ];

  respond() { /* ... */ }

}
```

Filters method themselves behave much like responders: they receive the
parsed request argument, and if they return any value other than null,
undefined, or a Promise that resolves something other than null or undefined,
Denali will halt the request processing and attempt to render that value as
the response.

> **Note:** this means that you should take extra care with the return values of
> your filter methods. Accidentally returning a value will cause the request
> processing to halt prematurely, and Denali will attempt to render that value!
