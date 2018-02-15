---
title: Serializers
---

Since Denali is API focused, it ships with first class primitive for
rendering JSON response bodies.

At first, this might seem rather simple: just `JSON.stringify()` and you're
done! But in reality, when your app needs to send some data in a response,
there are three problems to face:

  1. **What data to send**: you'll often want to send only a subset of your
  record back (i.e. omitting a hashed password).

  2. **Transforming the data**: you may want to transform the content to make it
  easier to consume or to match consumer expectations (i.e. change underscore_
  keys to camelCaseKeys).

  3. **Structuring the data**: what is the structure of the response? Is there a root JSON wrapper? Does it conform to a spec, i.e. JSON-API 1.0?

Serializers address all of these problems. They select what data to send, apply
transformations to that data (i.e. renaming keys, serializing values), and
structure the result according to a particular output format.

Typically, your API will have a standard output format (i.e. JSON-API 1.0)
for all endpoints. A good approach is to pick (or create) a base
ApplicationSerializer class that renders that structure, and extend from that.

With a base ApplicationSerializer class in place, you'll then create a subclass
for each model you have (PostSerializer, UserSerializer, etc). These subclasses
tell Denali what attributes and relationships should be sent in a response that
contains that particular model.

## Rendering data in a response

Serializers render data based on _whitelists_. That means that if you want any
part of your Model to render into JSON in the response body, you must specify
it explicitly in that Model's Serializer. This ensures you won't
accidentally return sensitive data in a response because you forgot to strip it
out.

Selecting which attributes to render is as simple as adding them to the
attributes array on your serializer:

```js
export default class UserSerializer extends ApplicationSerializer {

  attributes = [ 'firstName', 'lastName' ];

}
```

This might seem like an onerous requirment at first, but as applications
grow, it's easy to loose track of what is actually rendered out where,
leading to security leaks as you forget to strip out sensitive information
from response bodies. Serializer whitelists force you to explicitly opt in to
every piece of data exposed to the world.

### Automatic whitelisting

For most applications, we strongly recommend sticking to the above
whitelisting approach. However, in rare cases, you may be building an app
that has no sensitive data. In fact, the API powering denalijs.org itself is
one such example - some of it's models are operating on purely public data
from the npm registry.

In these cases, it can be annoying to maintain a whitelist for a model's
serializer when there is no security risk. Here's a quick trick to
automatically whitelist all attributes on a given model:

```js
import Post from '../models/post';

export default PostSerializer extends ApplicationSerializer {

  attributes = Object.keys(Post.attributes);

}
```

That will ensure all attributes are immediately whitelisted with the serializer as they are added. **This approach is not recommended for applications dealing with _any_ sensitive data, which is likely most applications out there**.

### Serializing relationships

Relationships are slightly more complex than attributes, mostly because you need to tell the serializer whether to send the entire related model, or just the foriegn keys / references.

```js
export default PostSerializer extends ApplicationSerializer {
  relationships = {
    comments: {
      strategy: 'embed',
      key: 'discussion',
      serializer: PostCommentSerializer
    }
  }
}
```

As seen above, relationships have three main configuration options:

 - `strategy`: Valid options are `'embed'` (include the related model data in the response) or `'id'` (only include foreign keys / references). Some serializers may support custom strategies as well.
 - `key`: An override to use a different name for this relationship in the rendered response.
 - `serializer`: A custom serializer to use instead of the default one associated with the related model.

As a serializer renders the response and encounters relationships, it will
use these options, plus other potential custom options it defines, to turn
your models into JSON (or even other formats).

When using the `'embed'` strategy, the serializer will attempt to lookup the serializer for the related model to ensure it uses the appropriate whitelists when rendering the contents of the related model.


# Built-in Serializers

Denali ships with two base serializers out of the box:

  * **JSONSerializer**, which renders models as simple JSON objects or arrays of objects. Related records are directly embedded under their relationship name.

  * **JSONAPISerializer**, a [JSON-API 1.0] compliant serializer with support
  for meta, links, errors, and more.

