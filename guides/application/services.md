---
title: Services
---

Services are long lived objects in your app that usually expose app-wide
functionality. Some good examples might be a cache service, which maintains a
persistent connection to a Redis database; or a mailer service, which
centralizes the logic for formatting and sending emails.

Services are defined as subclasses of the base `Service` class, and are
automatically created as singletons:

```js
import { Service } from 'denali';

export default class CacheService extends Service {

  read() {
    // ...
  }

  write() {
    // ...
  }

  // ...
}
```

Within an action, you can get a reference to a service's singleton using the
`this.service(serviceName)` method. Continuing with our `CacheService` example:

```js
import { Action } from 'denali';

export default class CachedAction extends Action {

  respond() {
    let cache = this.service('cache');
    if (cache.has(cacheKey)) {
      return cache.read(cacheKey);
    }
    // ...
  }
}
```