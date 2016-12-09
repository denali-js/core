---
title: Models
---


# Models

Denali's Models are actually just thin wrappers over your own ORM's model instances. They leverage [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to let your ORM's methods and properties to continue to work, while guaranteeing a basic common interface across all ORMs.

## Defining a Model

Models are defined in the `app/models/` folder. Conventionally, models extend from a common base, the ApplicationModel:

```js
// app/models/application.js
import { Model } from 'denali';

export default class ApplicationModel extends Model {
  // add any common, application-wide model functionality here
}
```

Let's create a basic model representing a blog post:

```js
// app/models/post.js
import { attr } from 'denali';
import ApplicationModel from './application';

export default class Post extends ApplicationModel {

  static title = attr('text');

}
```

Here we started out by adding a `title` attribute to our Post model. We use the `attr()` method exported by Denali to define an attribute. The single argument is the data type of that attribute.

### Data Types

Denali provides a common base set of data types for most ORM adapters:

* `text`
* `number`
* `date`
* `boolean`
* `object`

In addition to the basic data types, your ORM adapter can support additional, more specialized data types (i.e. `integer` rather than `number`).

Keep in mind that each ORM adapter decides for itself how best to implement these common data types, and it may be more performant to go with an ORM-specific type in some cases. For example, ORMs for SQL based data stores should implement the `number` data type as a `float` or `double` rather than an `integer`, since JavaScript numbers are floating point.

The value of the common base set of data types is that it allows addons that manage data attributes to safely assume a certain subset of data types.

### Relationships

In addition to basic data attributes, you can also define relationships on your model classes (assuming your ORM supports relationships):

```js
// app/models/post.js
import { attr, hasMany, hasOne } from 'denali';
import ApplicationModel from './application';

export default class Post extends ApplicationModel {

  static title = attr('text');
  static comments = hasMany('comment');
  static author = hasOne('user');

}
```

## Querying Data

Models expose the `.find()` static method for querying data. It has a few basic forms:

```js
// Find post with id 1
Post.find(1);

// Find posts that match the filter
Post.find({ title: 'My cool post' });

// Find posts using ORM specific querying
Post.find((/* Your ORM can pass in arguments, i.e. a query builder */) => {
  // You can use ORM-specific syntax here
});
```

The second and third forms are ORM-specific - you should consult your ORM adapter's docs for details on the semantics and querying interfaces.

Models also expose the `.findOne()` static method, which is just syntatic sugar for:

```js
let posts = await Post.find({ foo: 'bar' });
posts[0];
```

## Saving Data

Models expose a `.save()` instance method that returns a promise which resolves or rejects when the save operation is complete.
