# Operations

* Load testing / benchmarks?
* Caching headers
  * https://devcenter.heroku.com/articles/increasing-application-performance-with-http-cache-headers
  * two main strategies - ttl (cache for x time) or fingerprint (use cache unless lmt or fingerprint is different)
  * could look like:
      {
        expiresIn: 60 * 60 // 1 hour
        lastModified(params) {
          return Resource.find(params.id).lmt // acts like before filter
        }
        fingerprint(responseBody) {
          return hash(responseBody)
        }
      }

# Instrumentation

* `instrument([data], callback)` invokes the callback, which can return a
  promise that resolves when any async activity completes.
* Calling `instrument()` fires an event once the callback completes, with
  includes the timing info (start, end, duration) and the optional data
  supplied to the `instrument()` call, and a UUID for the event
* Should be used to instrument internal framework steps
* Should be able to add timing info to the meta block of JSONAPI responses

# Security

* Need to figure out if it makes sense / is possible to separate auth from
  session management. It would be cool if the framework or an addon could do
  stuff to the session without knowing how auth works. I.e. invalidate a session
  if the IP changes in the middle, without knowing how auth is handled.
* Built in or core addon for rate limiting, throttling, and blacklisting
* Optionally force SSL if SSL is enabled
  * Either drop insecured HTTP, redirect, or allow
* Security review / audit

# Debugging

* [STRETCH] The default HTML error page could embed node inspector, potentially
  even pause on the exception in question

# Addons

## Databases

Do these even make sense? There's no ORM / adapter really.

* Postgres
* Mongo
* Redis
* Mysql

## ORMs

* Sequelize
* Bookshelf
* Mongoose
* node-orm(2)

## Monitoring

* Newrelic
* Librato

## Logging

* Papertrail
* Logentries

## Email

* Mailchimp
* Mandril
* Sendgrid
* SES

## Error Reporting

* Rollbar

## Analytics

* Keen
* Mixpanel

## Payments

* Stripe

# Jobs

# Mailers

# CLI

* Docs command
  * Generate documentation for your API, different output formats (including
    Swagger)
  * Interactive docs (i.e. "try this request")
* Custom commands
  * Tasks that an app or addon can add to the cli
* Support arbitrary blueprint sources (i.e. local folders, git urls)
