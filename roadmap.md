# CLI Spec

## Commands

`new` - create new project
`install` - install an addon
`generate` - scaffold a blueprint
`serve` - run the server
  * should be suitable for production in prod mode (cluster?)
  * should be suitable for dev (rebuild on changes)
  * should avoid port binding in test mode (simulate requests with helpers)
  * should support running a docs server as well (default in dev, optional in prod)
  * should have debugger options
    * can we start debugging on demand? In prod?
    * can we use some kind of GUI here?
`test` - run the test suite
  * should support pluggable testing frameworks
`deploy` - deploy to a target environment
  * should support pluggable deploy steps
`docs` - generate documentation for your API
  * should allow addons to add to docs (i.e. a validation addon)

## Build

* support preprocessors & minification/uglification





# Runtime Spec

## Accessories

* logging should be pluggable with decent default
  * how does Rails/Phoenix do it?


## Config

* needs to support ENV vars in a sane way (i.e. ENV var name may not == config var name, don't want to do out-of-band mapping)
* what's the load order? Most ORMs require static config (or at least, config defined before the models are)


## Blackburn

* needs normalization hooks
  * hooks to hydrate into ORM model instances if wanted
  * at a minimum, normalize keys


## Controllers? Endpoints? Actions?

* Action files seems good, but how to model the filters?
  * Is it purely based on inheritance (i.e. you define base actions at each layer needed, and just extend from those), or do actions traverse the tree to find applicable actions from higher levels?

## Pod structure?

* It would be cool to be able to drop in new "types" of files on a specific endpoint/action, or group of endpoints/actions. I.e. a schema file could sit alongside the action it validates and automagically be applied. Or even something like logging (turn on verbose logging for this one endpoint) or caching (define a cache policy for this action only)
  * Nope, no reason for the separate files. Addon couldn't merge without know route structure. But if we export Action classes, we could add config on those, which turns opaque middleware functions into introspection-enabled constructs - we can apply convention and leverage that.

## Services?

* I.e. database, email sending, cache?

## Error handling

* by default, errors and exceptions should be rendered out in the response in dev
  * use content-negotiation to render html for browser requests

## Security

* secure by default
* CSP, CORS, frame-jacking headers
* review OWASP, node security
  * runtime vulnerabilities as well as compile time - scan for package vulnerabilities?
