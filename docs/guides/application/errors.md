---
title: Errors
---

Denali exposes common HTTP error classes for you to use throughout your app.
These error classes provide a standardized way to communicate various failure
scenarios throughout your entire codebase.

These errors are automatically created with the correct HTTP status code, and
Denali will use the status code when sending the response if you return the
error from your action's responder method:

```js
import { Action, Errors } from '@denali-js/core';

export default class NotFoundAction extends Action {

  // Will send a 404 Not Found response. The response body will be formatted by
  // your application serializer.
  respond() {
    return new Errors.NotFound('The resource you requested was not found');
  }

}
```

All defined HTTP error status codes (i.e. status codes 400 and above) are
implemented. If your action throws, returns, or renders an error that is not a
subclass of one of these supplied HTTP error classes, it defaults to a HTTP 500
status code in the response.