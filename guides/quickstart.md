---
title: Quickstart
layout: guide
after: Introduction
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
$ denali new blog
denali v0.1.0 [global]
  create app/actions/application.js
  create app/actions/index.js
  create app/adapters/application.js
  create app/models/.gitkeep
  create app/serializers/.gitkeep
  create app/services/.gitkeep
  create config/environment.js
  create config/middleware.js
  create config/routes.js
  create test/helpers/.gitkeep
  create test/integration/.gitkeep
  create test/unit/.gitkeep
  create test/index.js
  create .eslintrc
  create .gitattributes
  create .gitignore
  create CHANGELOG.md
  create denali-build.js
  create package.json
  create README.md

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

> **Heads up!** Notice that we didn't visit that localhost URL in the browser. That's because Denali is designed to build **APIs** rather than HTML rendering applications. If you are looking for Node framework to build a server rendered web application, you might want to try something like Sails.js or Express.

Woo, we got an app up and running! Now that's great, but it's not _that_ exciting. Let's crack open the scaffolded code to see how that root endpoint is working, and how to add our own.

### Directory structure

The `denali new` command did a lot of setup for us. It created the following directory structure:

```txt
blog/
  app/
    actions/
      application.js
      index.js
    adapters/
      application.js
    models/
    serializers/
  config/
    initializers/
    environment.js
    middleware.js
    routes.js
  test/
    helpers/
    integration/
    unit/
  .eslintrc
  CHANGELOG.md
  denali-build.js
  package.json
  README.md
```

There's a lot there, but for now, let's open up the `config/routes.js` to see how that root endpoint is being handled:

```js
// config/routes.js
export default function drawRoutes() {

  this.get('/', 'index');

}
```

This should look somewhat familiar if you used frameworks like Rails before. The `this.get()` method adds an endpoint that responds to GET requests at the url provided in the first argument (`'/'` in this case).

The second argument identifies an action to route these requests to (in this case, the `index` action).

In `app/actions/index.js`, we can see how that is handled:

```js
// app/actions/index.js
import ApplicationAction from './application';

export default ApplicationAction.extend {

  respond() {
    return {
      denaliVersion: version,
      message: 'Welcome to Denali!'
    };
  }

}
```

Let's break down what's going on here:

* `import ApplicationAction from './application';` - we import the `ApplicationAction` to use as our common base class. You could import the base `Action` class from the `denali` module directly, but having a base class for all actions in your app is handy (and the convention).
* `respond() {` - the `respond()` method is the meat of any action. It defines how the action responds to an incoming request.
* `return {...}` - you can tell Denali what to respond to a request with in a few different ways. Here, we directly return the object we want Denali to send as JSON.

The end result here is an action which will always respond with the same JSON object that we saw above.

## Adding a resource

Now let's get a bit more creative. Our blog API is going to need to store and retrieve our blog Posts. Let's create a Post resource to enable that.

> Normally, you'd probably store those in some kind of database (i.e. Mongo, Postgres, MySQL, etc). Denali is **database agnostic** though. So for now, we'll use plain ol' JS objects (a.k.a. POJOs). But you could easily substitute your own models in later. For more details, check out the Data guides.

To start, let's use that handy scaffolding tool again:

```sh
$ denali generate resource posts
```

This scaffold creates several files:

  * A set of **actions** for this resource with the basic CRUD operations stubbed out. These files are where you'll implement your application logic to respond to a particular request. We saw these above.

  * A **serializer** to determine how your Posts will be rendered in the response. We'll learn more about this in a bit.

  * A **model** to represent your Posts. Notice that the file is empty - this isn't required (since Denali is database agnostic). It's just wants to be helpful!

  * A placeholder **integration test suite** for this resource. Denali comes with a first-class testing environment, setup and ready to go.

If we open up `app/actions/posts/` now, you can see the stubbed out actions:

```js
  // app/actions/posts/list.js
  export default ApplicationAction.extend({
    respond() {
      return new Errors.NotImplemented();
    },
  });
```

Let's go ahead and implement that list action now. We'll hardcode the Posts into the response for now:

```js
// app/controllers/posts.js

  respond() {
    return [
      {
        id: 1,
        title: 'Denali is awesome'
      },
      {
        id: 2,
        title: 'You are awesome!'
      }
    ];
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

A Serializer takes an in-memory payload object (or array), and transforms into JSON to send back in the response. There's two parts to this problem:

  1. **What data to send**: many times you want to send only a subset of your records back (i.e. omitting a hashed password) or you want to transform the content (i.e. change underscore_keys to camelCaseKeys).

  2. **How to send it**: what is the structure of the response? Is there a root JSON wrapper? Does it conform to a spec, i.e. JSON-API 1.0?

Serializers address both of these problems. They select what data to send, apply transformations to that data (i.e. renaming keys, serializing values), and structure the result according to a particular output format.

Typically, your API will have a standard output format (i.e. JSON-API 1.0). A good approach is to pick (or create) a base Serializer class that renders that structure, much like we used a base ApplicationAction class.

Then create a subclass for each model you have. These subclasses would then tell Denali what attributes and relationships should be sent in a response that contains that model.

## Serializers in action

So what happened to our Post titles from the example above? They were automatically stripped out - Serializers will treat their attributes list as a white-list, and our PostSerializer had no attributes listed!

Let's fix that by adding `'title'` to the attributes whitelist then:

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

## Integrating your ORM with Adapters

Denali is an **ORM-agnostic** framework. ORMs are difficult to get right, and
a one-size-fits-all solution tends to reduce the strengths of each data store to the lowest common denominator. The result is that you could be forced to miss out on the very benefits that led you to choose a particular datastore.

Denali sidesteps the issue entirely, focusing instead on providing a solid API framework to build off of, and the appropriate integration points to hook in your ORM of choice.

This is done with **Adapters**, which provide a common interface to allow Denali to extract whatever information it needs from your models. Adapters exist for [several popular ORMs](./supported-orms) already, packaged as addons for easy installation.

## Next Steps

Congrats, you made it through the quickstart guide. From here, you can:

* Check out the rest of the guides to learn more about the different parts of the framework
* Dive into the API documentation to get into the gritty details
* Explore the [heavily commented source code](https://github.com/{{site.repo}})
