---
title: Container and Dependency Injection
---

Denali ships with a powerful dependency injection system built into the
framework, which serves a few goals:

* Make testing easier by allowing tests to inject mocked or stubbed values for
dependencies rather than hardcoding them.
* Manage singleton lifecycles
* Allow tests to automatically parallelized whenever possible
* Allow addons to supply functionality, without the consuming application
  knowing exactly which addon is providing it.
* Decouple the on-disk structure of the application from how dependencies are
  resolved.

For most users, this all happens under the hood. The primary way most
application code will interact with the dependency injection system is via
`lookup()`.

## Looking up dependencies

Let's say we have a `CreatePurchase` action, which is responsible for
submitting an order to a third party payment processor and sending a
confirmation email upon success. To do this, our action needs to leverage the
`payment-processor` service to charge a credit card, and the `mailer` service
to send the email.

Using `lookup()`, we can supply our action with these dependencies as simple
instance properties:

```js
import { lookup } from 'denali';
import ApplicationAction from `./application';

export default class CreatePurchase extends ApplicationAction {

  paymentProcessor = lookup('service:payment-processor');
  mailer = lookup('service:mailer');

  respond({ body }) {
    await this.paymentProcessor.charge(body.amount, body.cardToken);
    this.mailer.send('order-confirmation', {
      amount: body.amount
    });
    // ...
  }

}
```

As we can see, the looked up dependencies are available as properties on our
action instance.

## Injecting dependencies

Looking up dependencies is handy, but one of the real strengths of the
Container can be seen when injecting dependencies in tests. Continuing our
example from above, let's imagine we try to test our `CreatePurchase` action.
Without the Container, that would be tricky - how do we test that code
without actually triggering a real purchase?

With Denali's Container and `inject()`, you can easily override dependencies
in your app, allowing you to isolate code and test what really matters:

```js
import { setupAcceptanceTest } from '@denali-js/core';

const test = setupAcceptanceTest();

test('create purchase charges the card', async (t) => {
  t.plan(1);
  let { app, inject } = t.context;
  inject('service:payment-processor', class extends Service {
    charge() {
      t.pass();
    }
  });
  await app.post('/purchases/create', purchaseData);
});
```

Let's break this down:

 - `t.plan(1)`: this let's Ava (Denali's test runner) know that we expect to
   have one assertion checked by the end of this test. If the test finishes
   with no assertions having run, Ava will fail the test.
 - `let { app, inject } = t.context`: Denali's `setupAcceptanceTest` helper
   adds these properties to the test's context object - we'll use them to carry
   out our test
 - `inject('service:payment-processor', ...)`: Here's the key - we tell
   Denali to replace the payment processor service with our own stub. This way,
   we can ensure the action appropriately invokes the payment processor without
   actually trigger a real payment
 - `await app.post('/purchases/create', purchaseData)`: Simulates sending an
   HTTP POST request to the `/purchases/create` endpoint

## Manually registrations

Normally, the container will take requests to lookup a particular dependency
and figure out how to find that file on the filesystem. However, there are
cases where you want to add something to the container that isn't represented
by a file on disk. You can do this via `container.register`.

In this example, our custom database driver uses a connection pool that the
entire application needs access to. After the pool is created in an
intializer as the app boots up, we'll add it to the container so that other
resources can look it up:

```js
// config/initializers/setup-database-connection-pool.js
import { container } from '@denali-js/core';
export default {
  name: 'setup-database-connection-pool',
  initialize() {
    let pool = createDatabaseConnectionPool();
    container.register('my-custom-db-driver:pool', pool);
  }
}
```

And now, elsewhere in the app, any consuer can fetch that reference to the
connection pool via `lookup()`:

```js
let pool = lookup('my-custom-db-driver:pool');
```

Keep in mind that when looking up container entries, manually registered
values always take precedence over any matching files on disk.