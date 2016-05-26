---
layout: guide
title: Serializers
category: Data
after: Adapters
---

There's two parts to this problem:

  1. **What data to send**: you'll often want to send only a subset of your
     records back (i.e. omitting a hashed password) or you want to transform the
     content (i.e. change underscore_keys to camelCaseKeys).

  2. **How to send it**: what is the structure of the response? Is there a root
     JSON wrapper? Does it conform to a spec, i.e. JSON-API 1.0?

Serializers address both of these problems. They select what data to send, apply
transformations to that data (i.e. renaming keys, serializing values), and
structure the result according to a particular output format.

Typically, your API will have a standard output format (i.e. JSON-API 1.0). A
good approach is to pick (or create) a base ApplicationSerializer class that
renders that structure, much like we used a base ApplicationAction class.

With a base ApplicationSerializer class in place, you'll then create a subclass
for each model you have (PostSerializer, UserSerializer, etc). These subclasses
tell Denali what attributes and relationships should be sent in a response that
contains that particular model.

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
