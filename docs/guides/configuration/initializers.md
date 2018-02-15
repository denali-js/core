---
title: Initializers
---

Initializers are functions that run after your application is loaded into
memory, but before it binds to a port to start accepting connections. It's
the ideal spot to do any kind of bootstrapping or setup to get your app ready
to start serving connections.

Initializers can return a Promise, and the application will wait for it to
resolve before proceeding to the next initializer (or starting the app if that
was the last one).

For example, here's an initializer that sets up a connection to a hypothetical
database, and pauses the application startup until the connection is
established:

```js
import { Container } from '@denali-js/core';
import MyDbManager from 'db-manager';

export default {
  name: 'db-connect',
  initialize(application) {
    let dbConfig = container.lookup('config:environment').db;
    let db = new MyDbManager(dbConfig);
    return new Promise((resolve, reject) => {
      db.on('connect', resolve);
      db.on('error', reject);
    });
  }
}
```

## Initializer order

Sometimes you may want an initializer to run before or after another. To let
Denali know what the order should be, just add a `before` and/or `after` string
or array of strings with names of other initializers to your initializer object:

```js
export default {
  name: 'sync-schema',
  before: [
    'seed-data',
    'setup-admins'
  ],
  after: 'db-connect',
  initialize() {
    // the 'db-connect' initializer has completed by this point
  }
}
```
