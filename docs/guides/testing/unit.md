---
title: Unit Testing
---

Denali ships with helpers to quickly and easily setup unit tests for your application:

```js
import { setupUnitTest } from 'denali';

const test = setupUnitTest(() => new FileService(), {
  'service:aws': true
});

test('it saves a file', async (t) => {
  let { subject, inject, lookup } = t.context;
  let aws = lookup('service:aws');
  let fileService = subject();
  await fileService.save({ ... })
  t.is(await aws.countFiles(), 1);
});
```

## `setupUnitTest()`

This helper will automatically handle the setup, initialization,
and teardown of an instance of your unit test.

Denali's approach is to easily allow you to dial in the right amount of isolation for your unit tests. Often, good unit tests end up needing to mock out other dependencies. Denali let's you use your actual app code rather than writing out a mock, if you are short on time:

```js
const test = setupUnitTest(() => new FileService(), {
  'service:aws': true // <-- The "true" tells Denali to use the _actual_ AWS service
});
```

Then, once you have a mock ready to go, just drop it in:

```js
const test = setupUnitTest(() => new FileService(), {
  'service:aws': MockAWS // <-- now your FileService will get the mock!
});
```