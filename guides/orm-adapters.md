---
layout: guide
title: ORM Adapters
category: Data
after: Serializers
---

# ORM Adapters

Denali takes a somewhat unique approach to handling the data layer. Unlike most
frameworks, it doesn't come bundled with a pre-chosen ORM. Instead, Denali's
Model class works with your ORM of choice by communicating with it through an
ORM Adapter.

This lets you bring your own ORM to your apps, while still enabling Denali to
understand your data model and leverage that.

## Creating an ORM Adapter

Want to use an ORM that doesn't have an adapter yet? It's fairly easy to write
your own! Just extend from the base `ORMAdapter` class, and implement each of
the hooks:

```js
export default class MyCoolORMAdapter extends ORMAdapter {

  static find(type, query, options) {

  }

  static createRecord(type, data, options) {

  }

  static idFor(record) {

  }

  static getAttribute(record, property) {

  }

  static setAttribute(record, property) {

  }

  static deleteAttribute(record, property) {

  }

  static getRelationship(record, relationship) {

  }

  static setRelationship(record, relationship) {

  }

  static deleteRelationship(record, relationship) {

  }

  static saveRecord(record, options) {

  }

  static deleteRecord(record, options) {

  }

  static define(Model) {

  }

}
```
