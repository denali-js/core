---
title: Services
---

Services are long lived singletons in your app that usually expose app-wide
functionality. Some good examples might be a caching service, which maintains a
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

Once you have defined your service, you can use it via injection in any of your
Denali classes:

```js
import { Action, inject } from 'denali';

export default class CachedAction extends Action {

  cache = inject('service:cache');

  respond() {
    if (this.cache.has(cacheKey)) {
      return this.cache.read(cacheKey);
    }
    // ...
  }
}
```