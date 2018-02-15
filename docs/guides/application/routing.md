---
title: Routing
---

Routing in Denali should feel familiar to anyone with experience in modern
server side frameworks. Routes are defined in `config/routes.js`.

To add individual routes, just invoke the appropriate method on the router and
supply the URL and action to route to:

```js
// Routes GET requests to /foo to the FooAction at `app/actions/foo.js`
router.get('/foo', 'foo');
```

All the common HTTP verbs are supported.


## Resourceful Routing

The router also exposes a `resource()` method for quickly adding an entire suite
of endpoints for a given resource (it follows the [JSON-API recommendations for
URL design](http://jsonapi.org/recommendations/#urls)):

```js
router.resource('post');
```

will generate the following routes:

| Endpoint                                      |  Action                   |
|-----------------------------------------------|---------------------------|
| `GET     /posts`                              | `posts/list`              |
| `POST    /posts`                              | `posts/create`            |
| `GET     /posts/:id`                          | `posts/show`              |
| `PATCH   /posts/:id`                          | `posts/update`            |
| `DELETE  /posts/:id`                          | `posts/destroy`           |
| `GET     /posts/:id/:relation`                | `posts/related`           |
| `GET     /posts/:id/relationships/:relation`  | `posts/fetch-related`     |
| `PATCH   /posts/:id/relationships/:relation`  | `posts/replace-related`   |
| `POST    /posts/:id/relationships/:relation`  | `posts/add-related`       |
| `DELETE  /posts/:id/relationships/:relation`  | `posts/remove-related`    |

You can limit the generated routes using the `only` or `except` options:

```js
// Generates only the list and show actions from the table above
router.resource('post', { only: [ 'list', 'show' ] });

// Generates all the routes from the table above, except for the destroy route
router.resource('post', { except: [ 'destroy' ] });

// Shorthand for except: [ 'related', 'fetch-related', 'replace-related', 'add-related', 'remove-related' ]
router.resource('post', { related: false });
```

## Namespacing

If you want to nest a group of routes underneath a common namespace, you can use
the `router.namespace()` method. You can either supply a function as a second
argument, or use the return object to declare your nested routes:

```js
router.namespace('admin', function(adminRouter) {
  adminRouter.get('products');
});
// or ...
let adminNamespace = router.namespace('admin');
adminNamespace.get('products');
```

