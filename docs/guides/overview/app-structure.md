---
title: App Structure
---

Denali follows a "layered conventions" philosophy. This means that it
attempts to provide robust, ergonomic behavior for most users, but allow
those with edge cases to drop down to lower levels of abstraction without
sacrificing the rest of the framework.

This is reflected in the directory structure and file layout of a Denali
application or addon. A minimal app that follows all of Denali's standard
conventions needs very little code beyond it's core business logic. But, if
you want to customize aspects of Denali's conventional behavior, most of that
is accomplished through extending the right classes in the right files.

This guide will walk through a complete Denali application, showcasing every file and what it does. But if this is overwhelming - fear not. Most of these files will not be needed by most applications.

## A complete application

```
app/
  actions/
  orm-adapters/
  parsers/
  serializers/
  services/
  views/
  application.js
  logger.js
  router.js
blueprints/
  <blueprint name>/
    files/
    index.js
commands/
config/
  initializers/
docs/
lib/
test/
  acceptance/
  unit/
denali-build.js
index.js
resolver.js
```

## `app/`

Holds the majority of your application code. This is where your actual
business logic tends to live. All files in this folder are automatically
loaded into the container, and their directory name is used as the type (i.e.
`app/foos/bar` would be loaded into the container under `foo:bar`).

### `app/application.js` (optional)

This file exports the root Application class used by your entire app. You
generally won't need to modify this file, it's typically advanced use cases
only.

### `app/logger.js` (optional)

The logger to use for your app. Add this file and export a class that matches
the Denali core logger API to implement your own logging.

### `app/router.js` (optional)

The router to use for your app. Add this file and export a class that matches
the Denali core router API to implement your own router. Note: implementing
your own router is **highly discouraged**. This is one of the most core
components of the Denali framework, and many addons may depend on it's
existing behavior. Override with caution.

### `app/actions/`

Your Actions are defined here, representing the controller layer of your application.

### `app/orm-adapters/`

ORM Adapters teach Denali how to talk to an ORM library. Most applications
won't need to add any files here. When determining which ORM adapter to use,
Models will look for one that corresponds to their own name (i.e. a `Post`
model will look for `orm-adapters/post.js`). If that isn't found, they'll
fall back to the `orm-adapters/application.js`. Most applications will only
use one ORM adapter, which would be installed as the default when installing
the ORM adapter addon.

In the less common case that you want to use different ORM adapters for
different models (i.e. you have multiple databases), or you want to customize
a community provided adapter, you can define your own here that will take
precedence.

### `app/parsers/`

Parsers are responsible for taking incoming requests and transforming them
into a consistent format for the rest of your application to use.

### `app/serializers/`

Serializers are responsible for taking the result of your actions and
transforming it into a consistent format to send "over the wire" to the
client.

Typically, you'll have a base ApplicationSerializer, and one Serializer for
each Model in your application (all inheriting from that base
ApplicationSerializer). This approach allows you to tweak the app-wide
serializer settings in one place (the base ApplicationSerializer) while
customizing the attribute and relationship whitelists for each Model as
needed.

### `app/services/`

TODO ...

### `app/views/`

TODO ...

# `config/`

Holds the declarative and executable configuration for your app. \*.js files
(other than `environment.js` and `initializers/*.js`) in this folder will be
automatically loaded into the container under their filename (i.e.
`config/foo.js` will be loaded under `config:foo`).

Configuration files in Denali tend to be JS files that export a function which
returns the configuration object. This gives the app developer greater
flexibility in constructing configuration: it allows for inter-dependent values
(i.e. option A depends on the value of option B), and easily using environment
variables via `process.env`.

Third party addons can add their own configuration files this way as well.

## `config/environment.js`

This file holds the configuration that varies per environment (i.e.
development vs. staging vs. production database details).

## `config/middleware.js`

This file exports a function which is invoked with the application's Router
as its first argument. It lets you add generic Connect-compatible middleware
to your application that will run _before_ the Router hands off to the
appropriate action.

## `config/routes.js`

You define your application's routes in this file. See the [Routing
guide](fixme) for more details.

# `test/`

The test suite for your app. See the [integration](../../testing/integration)
and [unit](fixme) testing guides for more details.
