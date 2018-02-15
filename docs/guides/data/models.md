---
title: Models
---

Denali's Models are one of the more unusual aspects of the framework - but
fear not! They are relatively simple to learn, and quite powerful once you
understand how to use them effectively.

In Denali, Models are actually thin wrappers over your ORM's own model objects. Denali Models mostly just forward operations on to the underlying ORM, via the ORM Adapter.

## Models do not hide your database

Probably the most important commonly misunderstood concept is that Denali
Models are there to allow you to swap out databases without refactoring your
app, or to otherwise hide / abstract away from the details of your database.

**This is incorrect.** In fact, Denali takes the stance that the _goal itself is
a red herring_.

If your app can swap database A with database B without changing your
application code, that must mean:

1. The underlying databases are identical in their querying and storage
   semantics (rarely the case), or
2. You were using some lowest common denominator of querying and storage
   semantics for the two databases that is equivalent across both (which means
   you weren't using the strengths of your original database)

Denali is built around the assumption that different databases have different
tradeoffs, and that you should pick the data store best suited to your use case.
This means a good data layer should highlight the unique strengths of choice of
a data store, rather than trying to hide any differences behind some kind of
universal interface.

If you're interested in more of the rationale behind Denali's data layer, and why there is one at all given the situation described above, check out the [blog post](FIXME)

## Defining a Model

Models are defined in the `app/models/` folder. Conventionally, models extend
from a common base, the ApplicationModel:

```js
// app/models/application.js
import { Model } from '@denali-js/core';

export default class ApplicationModel extends Model {
  // add any common, application-wide model functionality here
}
```

Let's create a basic model representing a blog post:

```js
// app/models/post.js
import { attr } from '@denali-js/core';
import ApplicationModel from './application';

export default class Post extends ApplicationModel {

  static schema = {
    title: attr('string')
  };

}
```

Here we started out by adding a `title` attribute to our Post model's schema.
We use the `attr()` method exported by Denali to define an attribute. The
single argument is the data type of that attribute.

### Data Types

Denali provides a common base set of data types for most ORM adapters:

* `string`
* `number`
* `date`
* `boolean`
* `object`

In addition to the basic data types, your ORM adapter can support additional,
more specialized data types (i.e. `integer` rather than `number`).

Keep in mind that each ORM adapter decides for itself how best to implement
these common data types, and it may be more performant to go with an
ORM-specific type in some cases. For example, ORMs for SQL based data stores
should implement the `number` data type as a `float` or `double` rather than an
`integer`, since JavaScript numbers are floating point. But if you know the
field should only container integers, you should use `integer` (assuming your
ORM adapter supports it).

The value of the common base set of data types is that it allows addons that
manage data attributes to safely assume a certain subset of data types.

### Relationships

In addition to basic data attributes, you can also define relationships on
your model classes:

```js
// app/models/post.js
import { attr, hasMany, hasOne } from '@denali-js/core';
import ApplicationModel from './application';

export default class Post extends ApplicationModel {

  static schema = {
    title: attr('text'),
    comments: hasMany('comment'),
    author: hasOne('user')
  }

}
```

Relationships in Denali might look slightly different than you're used to:
for example, there is no explicit `manyToMany()`. This is because Denali's
Models only need to understand their own side of the relationship. The result
is that you only need `hasMany` or `hasOne` to define the relationships, and
you must define _both sides_ of each relationship.

### Relationship Options

Despite Denali Models only needing to know whether it's a `hasOne` or
`hasMany` relationship, it's possible your ORM / database needs more
information to setup the relationship. In that case, you can supply it
options via a second argument to `hasOne` or `hasMany`.

Let's look at example of how this works:

```js
export default class Book extends ApplicationModel {
  static schema = {
    editor: hasOne('user', { inverse: 'booksEdited' }),
    author: hasOne('user', { inverse: 'booksAuthored' })
```

In this example, a `Book` has two relationships with `User` - `author` and
`editor`. Since a `User` can edit or author multiple books, that means the
`Book` will store the foreign key (i.e. `editor_id` and `author_id`).

Now what happens when you say `user.getBooksAuthored()`? Presumably, we would
query the database for all books that have that user's id. But wait - there
are two spots that might have a user id - `author_id` and `editor_id`.
There's not enough information here.

Some ORMs may solve this by asking you to clarify what the inverse side of
this relationship looks like (as in the example above). So we pass that in as
an additional option when we define the schema.

Denali itself doesn't care what's in that object - it just passes it on
through to the ORM for it to use as it wants. For details about what kinds of
options are supported, check your ORM adapter's documentation.

## Querying Data

Models expose a few methods for querying data:

```js
// Find post with id 1
Post.find(1);

// Find posts that match the filter
Post.query({ title: 'My cool post' });

// Find posts using ORM specific querying
Post.query((/* Your ORM can pass in arguments, i.e. a query builder */) => {
  // You can use ORM-specific syntax here
});

// Find all posts
Post.all()

// Find the first post that matches the supplied query (an object or
// ORM-specific function)
Post.queryOne()
```

Once you have a record, you can read attributes directly:

```js
let post = Post.find(1);
console.log(post.title);
// > "Denali is a tall mountain"
```

To read related data, you should use the `get[Relationship]` getters:

```js
let post = Post.find(1);
let author = await post.getAuthor()
console.log(author)
// <Author:17 name="Dave">
```

For one-to-one style relationships, you can use `set[Relationship]` to set
the related record. For one-to-many style relationships, you can use
`set[Relationship]` to replace the entire relationship at once, or
`add[Relationship]` and `remove[Relationship]` to operate on a single member
of the relationship at a time.

## Saving Data

Models expose an instance method called `.save()` that returns a promise
which resolves or rejects when the save operation is complete.
