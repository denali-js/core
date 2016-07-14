---
title: Integration
---

# Integration Testing

Denali comes with some testing helpers out of the box to make integration
testing simpler. While most of the tooling is based on Denali's testing
framework of choice, Mocha, the principles here should be applicable across
testing frameworks.

## `setupApp()`

This is the starting point of the Denali test helpers. When defining an
integration test suite, just add `setupApp()` to the block:

```js
describe('Creating a post', function() {

  setupApp();

  it('should create something', function() {
    // ...
  });

});
```

`setupApp()` will automatically handle the setup, initialization, and teardown
of an instance of your Application. It also adds the `this.app` property to the
test suite.

## Making test requests

In your tests, `this.app` provides a simple API for interacting with your app in
the test environment. In particular, it exposes methods for each HTTP verb (i.e.
`this.app.get()`, `this.app.post()`, etc) which let you simulate a request to
your app.

To make a test request, it's as simple as:

```js
it('should list posts', function() {
  return this.app.get('/posts')
    .then(({ status, body }) => {
      expect(status).to.equal(200);
      expect(body).to.be.an.array();
    });
});
```

There's a few things to note here:

  * The request method (`this.app.get`) returns a Promise. Don't forget to
  return that Promise when using Mocha to make sure it waits for your async
  activity to finish!
  * The promise resolves to an object with a `status` and `body` property
  * If the app responds with a status code >= 500, the request method will
  reject the promise. If it's < 500, it resolves it. This means that error
  responses from your API like 401 Unauthorized will result in the test request
  promise being _resolved_.

### Headers

Often when testing you'll need to manipulate the headers sent with the requests.
This is frequently done to manage login / logout state (via the Authorization
header). The test app provides a way to do this via `this.app.setHeader(name,
value)`. Headers persist on the test app, so you can log in as your test user in
a `before()` block, and stay logged in for the whole thing.
