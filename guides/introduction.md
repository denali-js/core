---
title: Why Denali?
url: why-denali
layout: guide
---

## Principles

Denali is built on a few core concepts:

  * **Don't reinvent the wheel.** Wherever possible, Denali makes use of existing solutions and projects, rather than roll it's own solution. When there is no good solution, we build it and (where possible) spin it off into a separate project which Denali depends on (see [foraker](https://davewasmer.github.io/foraker) and [blackburn](https://davewasmer.github.io/blackburn)).

  * **API-first.** Most server-side frameworks focus on server-rendered HTML applications, with APIs afterthought at best. Denali flips this around - it's entire focus is data-only JSON APIs. You won't find any HTML templating engines or asset compilers here.

  * **Data access / ORM agnostic**. ORMs and data layers are _hard_. Some of the hardest problems around. Denali doesn't pretend to solve that. Instead, it is completely agnostic about how you manage your data. Mongoose, Sequelize, Thinky, or even plain old JS objects - Denali doesn't care.[1]

## Why not [insert other framework]?

There are a few other framework options besides Denali. Here's a quick run down of the major differences with Denali:

1. **Rails** is a great default choice for many, with large ecosystem and a mature codebase. However, Rails is designed for a much wider range of uses cases, including primarily HTML rendering. That brings along a lot of cognitive overhead to manage. Also, for web apps, Ruby means learning an additional language.

2. **Express.js** is the foundation of much of the Node server-side world. It's lightweight, fast, and simple. But for complex applications, Express only provides the basics (routing and middleware). It lacks the higher level abstractions to make rapid development easier.

3. **Sails.js** is an effort to the be Node equivalent of Rails. However, many of the framework's patterns run counter to the Node ethos. It also comes tightly bound to Waterline, making it difficult to integrate with databases that Waterline doesn't support.

--------------
[1] If you choose an ORM that doesn't have out of the box support, you will need to write an adapter for it. But fear not, adapters are simple - only 4 methods to implement! Check out the [adapter docs](adapters) for details.
