---
title: Quickstart
url: quickstart
---

# Let's build a blog!

Oh yes, it's that ever-favorite first project for a server side framework. Let's build a simple blogging application as a way to demonstrate the Denali framework.

# Installation

First off, make sure you install Denali globally via npm:

```sh
$ npm install -g denali
```

# Creating our application

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
denali v0.0.0
2015-09-13T23:21:44.404Z [INFO] blog@0.0.1 server up on port 3000
```

Perfect! You've got your first Denali app up and running. Now let's see it in action. Hit the root endpoint with curl:

```txt
$ curl localhost:3000
{"denaliVersion":"0.0.1","message":"Welcome to Denali!"}
```

> **Heads up!** Notice that we didn't visit that localhost URL in the browser. That's because Denali is designed to build **APIs** rather than HTML rendering applications. If you are looking for Node framework to build a server rendered web application, you might want to try a different framework than Denali.

That's great, but it's not too exciting. Let's crack open the scaffolded code to see how that root endpoint is working, and how to add our own.

# Directory structure

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

# Adding a resource

The real power of Denali comes when you work with **resources**. Let's create a Post resource to represent our blog posts:

```sh
$ denali generate resource post
```

You'll notice this creates a new controller, `controllers/posts`
