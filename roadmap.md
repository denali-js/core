
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

# Security

* Need to figure out if it makes sense / is possible to separate auth from
  session management. It would be cool if the framework or an addon could do
  stuff to the session without knowing how auth works. I.e. invalidate a session
  if the IP changes in the middle, without knowing how auth is handled.
* Built in or core addon for rate limiting, throttling, and blacklisting
* Security review / audit
* Investigate OAuth (resource owner password grant)

# Instrumentation

* Should be able to add timing info to the meta block of JSONAPI responses
* Reporting addons, i.e. automatically report core framework instrumentation stats to new relic

# Debugging

* [STRETCH] The default HTML error page could embed node inspector, potentially
  even pause on the exception in question
* Actions can set "debug" or "log: verbose" to turn on highly detailed logging
  for that action only

# Integration Addons

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

* Investigate what other frameworks do (i.e. ActiveJob)
  * Rails / ActiveJob (http://guides.rubyonrails.org/active_job_basics.html)
  * Phoenix / Exq (http://learningwithjb.com/posts/exq-the-background-job-solution-for-phoenix)

* Investigate leading runners for Node, what their options / API looks like
  * agenda (https://github.com/rschmukler/agenda)
  * later.js (http://bunkat.github.io/later/)
  * node-schedule (https://www.npmjs.com/package/node-schedule)
  * backgrounder (http://jolira.github.io/backgrounder/)
  * node-resque (https://github.com/taskrabbit/node-resque)
  * https://speakerdeck.com/evantahler/background-jobs-plus-nodejs

# Mailers

* Investigate how ActiveMailer does it

# CLI

* add easy model access to console command
* Docs command
  * Generate documentation for your API, different output formats (including
    Swagger)
  * Interactive docs (i.e. "try this request")
* Support arbitrary blueprint sources (i.e. local folders, git urls)
