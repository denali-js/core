---
layout: guide
title: Middleware
category: Configuration
after: Environment
---

# Middleware

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

> **Note** keep in mind that middleware functions run **for all incoming
> requests**. If you want to limit the scope to certain actions only, try using
> a `before` filter on the actions themselves.
