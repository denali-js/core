---
title: Middleware
---

The Node community has developed a rich ecosystem of Connect and Express
compatible middleware functions. Denali lets you leverage the power of this open
source community by providing a simple integration point to plug these
middleware methods in.

The `config/middleware.js` file exports a function that will be invoked with a
reference to the application's Router. You can use that reference to add
middleware to the Router via `router.use()`:

```js
// config/middleware.js
export default function middleware(router) {
  router.use(function (req, res, next) {
    // ...
  });
}
```

These middleware are run in the order they are added, before an incoming request
is handed off to it's Action.

## When to use Middleware vs. Action Before Filters?

A common question is when is it appropriate to implement some functionality
as a middleware function vs. as an Action before filter. There's no hard and fast rules, but here are a couple suggestions:

 - Does the code need to run against only some requests, determined by their
 request URL? If so, then middleware is not a good choice. Middleware is run
 against every incoming request.
 - Does the code need access to the rest of your Denali app? Action filters might be a better choice.
 - Does the code expect the incoming request body to be parsed and ready? Action filters are the better choice - they are run after the parser stage.
