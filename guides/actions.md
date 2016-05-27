---
layout: guide
title: Actions
category: Application
after: Routing
---

# Actions

Actions form the core of interacting with a Denali application. They are the
controller layer in the MVC architecture, taking in incoming requests,
performing business logic, and handing off to the renderer to send the
response.

When a request comes in, Denali's [Router](guides/routing) will map the method
and URL to a particular Action. It will invoke the `respond()` method on that
class, which should return either:

  1. a `Response` instance,
  2. a Model instance or array of Model instances, or
  3. a Promise which resolves with (1) or (2)

## Actions as controllers

Actions are probably a bit different than most controllers you might be used to.
Rather than a single controller class that handles multiple different HTTP
endpoints, Actions represent just one endpoint (HTTP method + URL).

This might seem like overkill at first, but it enables powerful declarative
abstractions now that there is a 1:1 relationship between a class and
endpoint.

## Responding

The purpose of your Action is to respond to an incoming HTTP request. You do
this by defining a `respond()` method, and the return value (or resolved return
value) is used to render the response.

Your `respond()` method will be given a single argument: `params`. This is an
object that contains the combined data from the incoming request URL params (i.e.
`posts/:id`), query params (`posts?filter=foobar`), request body, and any
parameters specified when defining the route.

Because the `params` argument is the combined result of all these sources, it is
possible for naming collisions to occur (although in reality it's relatively
rare). In those cases, you can always access the raw sources via `this.request`
in your responder method (i.e. `this.request.query` holds the parsed query
params).

## Content negotiation

Denali's Actions support content negotiation out of the box. If the incoming
request includes an Accept header with a mime-type other than `*/*`, it will
attempt to find the responder that best matches that type.

Responders are methods on your Action that start with `respond`. So, for
example, to respond to an HTML request (`Accept: text/html`), define a
`respondToHtml()` method on your Action. It will be invoked, instead of
`respond()`.

If there is no matching responder for the requested mime type, Denali will fall
back to the generic `respond()` method.

## Filters

Actions also support the concept of before and after filters. These are methods
that run before or after your responder method. Before filters also have the
ability to render a response and abort the rest of the action handling (i.e.
skip subsequent before filters and the responder).

To add a filter, simply add the method name to the `before` or `after` array on
your Action:

```js
class CreatePurchase extends Action {

  static before = [ 'authenticateUser', 'confirmBalance' ];
  static after = [ 'trackPurchase' ];

  authenticateUser() {
    // makes sure the user is logged in
  }

  confirmBalance() {
    // make sure the user has money to make the purchase
  }

  trackPurchase() {
    // log the purchase in an analytics tool, but don't hold up rendering the
    // response for it
  }

}
```

Filters are inherited. Want to authenticate all requests against your API? Just
add an authentication before filter to your ApplicationAction, and it will run
on all requests:

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

Filters behave much like responders: they receive the params argument, and if
they return any value other than null (or a Promise that resolves to a value
other than null), Denali will halt the request processing and attempt to render
that value as the response.

> **Note:** this means that you should take extra care with the return values of
> your filter methods. Accidentally returning a value will cause the request
> processing to halt prematurely, and Denali will attempt to render that value!


