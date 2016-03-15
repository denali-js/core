---
title: Get Started with Denali
---

# Get Started with Denali

It's that ever-favorite first project for a server side framework: let's build a basic blogging application!

## Installation

First off, make sure you install Denali globally via npm:

```sh
$ npm install -g denali
```

## Scaffolding our application

Next, let's use Denali's handy scaffolding tools to create a blank slate for us to start from:

```txt
$ npm new blog
denali v0.0.1 [global]
  create .eslintrc
  create .gitattributes
  create .gitignore
  create CHANGELOG.md
  create README.md
  create app/adapters/application.js
  create app/controllers/application.js
  create app/jobs/.gitkeep
  create app/models/.gitkeep
  create app/serializers/.gitkeep
  create config/database.json
  create config/initializers/database.js
  create config/middleware.js
  create config/routes.js
  create index.js
  create package.json
  create test/helpers/.gitkeep

Installing npm dependencies ...
Setting up git repo ...


Installation complete!
To launch your application, just run:

  $ cd blog && denali server
```

Go ahead and follow that last instruction:

```txt
$ cd blog
$ denali server
denali v0.0.1
2015-09-13T23:21:44.404Z [INFO] blog@0.0.1 server up on port 3000
```

Perfect! You've got your first Denali app up and running. Now let's see it in action. Hit the root endpoint with curl:

```txt
$ curl localhost:3000
{"denaliVersion":"0.0.1","message":"Welcome to Denali!"}
```

> **Heads up!** Notice that we didn't visit that localhost URL in the browser. That's because Denali is designed to build **APIs** rather than HTML rendering applications. If you are looking for Node framework to build a server rendered web application, you might want to try a different framework than Denali.

Woo, we got an app up and running! Now that's great, but it's not _that_ exciting. Let's crack open the scaffolded code to see how that root endpoint is working, and how to add our own.

### Directory structure

The `denali new` command did a lot of setup for us. It created the following directory structure:

```txt
blog/
  app/
    adapters/
      application.js
    controllers/
      application.js
    jobs/
    models/
    serializers/
  config/
    initializers/
      database.js
    database.json
    middleware.js
    routes.js
  test/
    helpers/
  .eslintrc
  CHANGELOG.md
  index.js
  package.json
  README.md
```

There's a lot there, but for now, let's open up the `config/routes.js` to see how that root endpoint is being handled:

```js
// config/routes.js
export default function drawRoutes() {

  this.get('/', 'application.index');

}
```

This should look somewhat familiar. The `this.get()` method adds an endpoint that responds to GET requests at the url provided in the first argument.

The second argument identifies a controller action to route these requests to (in this case, the `ApplicationController`'s `index` action).

In `app/controllers/application.js`, we can see how that is handled:

```js
// app/controllers/application.js
import { Controller, version } from 'denali';

export default Controller.extend {

  index(req, res) {
    res.json({
      denaliVersion: version,
      message: 'Welcome to Denali!'
    });
  }

}
```

As you can see, the `index` action on the Controller looks just like a regular Express route handling function. It accepts the `req` and `res` objects, and writes a simple object to the response.

## Adding a resource

Now our blog API is going to need to store and retrieve our blog Posts. Let's create a Post resource to enable that.

> Normally, you'd probably store those in some kind of database (i.e. Mongo, Postgres, MySQL, etc). **Denali is database agnostic** though. So for now, we'll use plain ole' JS objects. But you could easily substitute your own models in later.

To start, let's use the handy scaffolding tools again:

```sh
$ denali generate resource posts
```

This scaffold creates several files:

  * A **controller** for this resource with the basic CRUD operations stubbed out. This is where you'll implement your application logic to respond to a particular request. We saw these above.

  * A **serializer** to determine how your Posts will be rendered in the response. See below for an explanation of serializers.

  * A **model** to represent your Posts. Notice that the file is empty - this isn't required (since Denali is database agnostic). It's just wants to be helpful!

The scaffold also added an empty test suite as well.

If we open up `app/controllers/posts.js` now, you can see the stubbed out actions:

```js
  // ...

  list(req, res) {
    res.render(new Errors.NotImplemented());
  },

  // ...
```

Let's go ahead and implement that list action now. We'll hardcode the Posts into the response for now:

```js
// app/controllers/posts.js

  list(req, res) {
    res.render([
      {
        id: 1,
        title: 'Denali is awesome'
      },
      {
        id: 2,
        title: 'You are awesome!'
      }
    ])
  }
```

Great! Let's hit that endpoint now:

```sh
$ curl localhost:3000/posts
[
  {
    id: 1
  },
  {
    id: 2
  }
]
```

**Wait, hang on**. Our Post titles are gone!

## Working with Serializers

This is our first lesson in working with Serializers. They are a core concept in Denali, and are a powerful tool for building _robust_ APIs.

A Serializer takes a payload, and transforms into JSON to send back in the response. There's two parts to this problem:

  1. **What data to send**: many times you want to send only a subset of your records back (i.e. omitting a hashed password) or you want to transform the content (i.e. change underscore_keys to camelCaseKeys).

  2. **How to send it**: what is the structure of the response? Is there a root JSON wrapper? Does it conform to a spec, i.e. JSON-API 1.0?

Serializers address both of these problems. They select what data to send, apply transformations to that data (i.e. renaming keys, serializing values), and structure the result according to a particular output format.

Typically, your API will have a standard output format (i.e. all responses have a wrapper object, related records under the `relationships` key, etc). A good approach is to pick (or create) a base Serializer class that renders that structure.

Then you would create a subclass for each model you have. The model-specific subclass would then tell Denali what attributes and relationships should be sent in a response that contains that model.

## Serializers in action

So what happened to our Post titles from the example above? They were automatically stripped out - Serializers will treat their attributes list as a white-list by default.

Let's add `'title'` to that list then:

```js
// app/serializers/posts.js
export default FlatSerializer.extends({

  // We added the title attribute, so now Denali will include
  // it in the response
  attributes: [ 'title' ],
```

Sure enough, if we hit the endpoint again:

```sh
$ curl localhost:3000/posts
[
  {
    id: 1,
    title: 'Denali is awesome'
  },
  {
    id: 2,
    title: 'You are awesome!'
  }
]
```

It might seem like a bit of overhead at first, but Serializers quickly become a powerful tool. They allow you to decouple your application logic and data layer from how a response body is structured, making changes to either side that much easier.
