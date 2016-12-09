---
title: ORM Adapters
---

# ORM Adapters

Denali takes a somewhat unique approach to handling the data layer. Unlike most
frameworks, it doesn't come bundled with a "blessed" ORM, or attempt to build
it's own. Instead, Denali's Model class works with your ORM of choice by
communicating with it through an ORM Adapter.

This lets you bring your own ORM to your apps, while still enabling Denali to
understand your data model. This is good news for your app, since it lets you
pick the right ORM for the job and leverage the strengths of the specific data
store backing your app, rather than relying on a lowest-common-denominator data
layer.

## Available ORM Adapters

Several popular ORMs have Denali adapters ready to go. Just add them to your
project via `$ denali install <adapter package name>`, and set the `ormAdapter`
property in your `config/environment.js` file to the ORM's name.

* [`node-orm2`](https://github.com/denali-js/denali-node-orm2) (beta)
* ~~`Sequelize`~~ (coming soon)
* ~~`Bookshelf`~~ (coming soon)

## Creating an ORM Adapter

Want to use an ORM that doesn't have an adapter yet? It's fairly easy to write
your own! Just extend from the base `ORMAdapter` class, and implement each of
the hooks:

```js
export default class MyCoolORMAdapter extends ORMAdapter {

  async find(type, query) {}

  async findOne(type, query) {}

  buildRecord(type, data) {}

  idFor(model) {}

  setId() {}

  getAttribute(model, property) {}

  setAttribute(model, property, value) {}

  deleteAttribute(model, property) {}

  async getRelated(model, relationship, descriptor) {}

  async setRelated(model, relationship, descriptor, relatedRecords) {}

  async addRelated(model, relationship, descriptor, relatedRecord) {}

  async removeRelated(model, relationship, descriptor, relatedRecord) {}

  async saveRecord(type, model) {}

  async deleteRecord(type, model) {}

}
```

### Why Adapters?

It's important to understand why Denali uses an ORM adapter strategy for handling ORMs: **the goal is _not_ to allow you to swap out ORMs and/or databases with zero refactoring.**

In fact, Denali views such a goal as harmful. If you could swap out ORMs and databases with zero refactoring, it must mean that the API is the same for both. This assumes that all databases are basically the same, and there's no real difference in the semantics of each.

Of course, this is obviously false - different data stores offer wildly different semantics and characteristics. Ultimately, any attempt to create such an interface leads to a "least common denominator" API that leaves you missing out on the strengths of your particular stack.

So Denali doesn't attempt to mask over these differences. In fact, you shouldn't be surprised if you find ORM/database specific code in your Denali app - that's okay! It's usually necessary to get the most from your backend.

So, why does Denali deal with data at all? The answer is mostly: addons.

Denali's ORM adapters and Model interface are mostly designed so that addons have a consistent way to interact with the data in your application in a basic way. It allows an addon like [denali-auth](https://github.com/denali-js/denali-mailer) to store data like email confirmation tokens without the addon itself needing to anticipate every possible data store.
