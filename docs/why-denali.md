---
title: Why Denali?
url: why-denali
---

# Why Denali?

Because Denali is opinionated and narrow in it's goals, it's not necessarily right for every situation. This page is a breakdown of Denali's strengths, and when it makes for a good choice.

## Principles

Denali is built on a few core concepts:

  * **Don't reinvent the wheel.** Wherever possible, Denali makes use of existing solutions and projects, rather than roll it's own solution. When there is no good solution, we build it and (where possible) spin it off into a separate project which Denali depends on (see foraker and blackburn).

  * **API-first (i.e. single page app focused).** Most server-side frameworks focus on server-rendered HTML applications, with APIs afterthought at best. Denali flips this around - it's entire focus is data-only JSON APIs. You won't find any HTML templating engines or asset compilers here.

  * **Data access / ORM agnostic**. ORMs and data layers are _hard_. Some of the hardest problems around. Denali doesn't pretend to solve that. Instead, it is completely agnostic about how you manage your data. Mongoose, Sequelize, or even plain old JS objects - Denali doesn't care.[1]

## Why not [insert other framework]?

Denali is focused on provide data APIs, primarily to frontend single page applications. With that use case in mind, there aren't a lot of other good options:

1. **Rails** is the default choice for many. If you have experience in Rails, it could be a great choice. However, the performance of out-of-the-box Rails isn't great, and it's another language / server environment to learn.
2. **Express.js** is the foundation of much of the Node server-side world. It's lightweight, fast, and simple. But it doesn't provide much functionality out of the box, leading to everyone implementing it their own way.
3. **Sails.js** is perhaps the best contender. An attempt to bring the convenience of Rails into the Node world, the project is an impressive effort. However, it doesn't rub your

--------------
[1] If you choose an ORM that doesn't have out of the box support, you will need to write an adapter for it. But fear not, adapters are simple - only 4 methods to implement! Check out the [adapter docs](adapters) for details.
