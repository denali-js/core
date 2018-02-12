---
title: Container and Dependency Injection
---

Denali ships with a powerful dependency injection system built into the
framework, which serves a few goals:

* Make testing easier by allowing tests to inject mocked or stubbed values for
dependencies rather than hardcoding them.
* Allow addons to supply functionality, without the consuming application
knowing exactly which addon is providing it.
* Decouple the on-disk structure of the application from how dependencies are
resolved.

For most users, this all happens under the hood. The primary way most
application code will interact with the dependency injection system is via
`inject()`.

## Injecting dependencies

Let's say we have a `CreatePurchase` action, which is responsible for submitting
an order to a third party payment processor and sending a confirmation email
upon success. To do this, our action needs to leverage the `payment-processor`
service to charge a credit card, and the `mailer` service to send the email.

Using `inject()`, we can supply our action with these dependencies as simple
instance properties:

```js
import { inject } from 'denali';
import ApplicationAction from `./application';

export default class CreatePurchase extends ApplicationAction {

  paymentProcessor = inject('service:payment-processor');
  mailer = inject('service:mailer');

  respond({ body }) {
    await this.paymentProcessor.charge(body.amount, body.cardToken);
    this.mailer.send('order-confirmation', {
      amount: body.amount
    });
    // ...
  }

}
```

As we can see, the injected dependencies are available as properties on our
action instance. In a test environment, we can now stub out these dependencies
easily:

```js
test('create purchase charges the card', async (t) => {
  t.plan(1);
  let container = new Container();
  container.register('service:payment-processor', class extends Service {
    charge() {
      t.pass();
    }
  });
  container.register('action:create-purchase', CreatePurchase);
  // ...
});
```

Now, when we instantiate the action through the container, our fake payment
processor with a mocked `charge()` method will be used instead of the real thing.