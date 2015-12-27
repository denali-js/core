Draft
- [x] preprocessor support w/ sourcemap support
- [x] precompile & minify prod builds
- [x] default logger with swappable interface
- [x] addon loading & config
- [x] content negotiation for actions
- [x] default CSP, CORS, frame-jacking headers and config

Delayed
* jobs
* allow additional debug options (via REPL?)
  * allow it to start in debug mode, or to send a SIG to the process to trigger
    debug mode
  * use blessed to create gui/admin style interface in terminal
    * can trigger it on stdio (for dev mode) or via telnet (for staging/prod)
* add normalization to blackburn
  * support hydrating into ORM instances
  * normalize keys
* find heroku addons, build addons for those saas services
* testing framework
  * database mock?
  * mocking services
  * test helpers
  * generate tests from action classes
  * addon testing
* error handling
  * special error actions? per folder, app wide?
  * most errors should result in output, not crashing, ideally
  * serve html error page to browsers, with additional details in dev
* docs command
  * swagger-like (or actually swagger) generation?
  * show API browser / console for text/html requests (i.e. in browser) via addon
* install command
* extract eslint styles to preset dependency
* support arbitrary blueprint sources (i.e. local folders, git urls)
* containers lookup in child engines if not found
   * add default lookups for error route





Application
  bootstraps everything
  global aspects:
    transports (once a transport is included, it's there for everyone)

Engine
  loading
  addons/engines
  local routes
  local builds/compiling

Transport
  communication, request / response

Service
  external dependencies (database, email sending service, bug reporting)

Action
  performs a logical unit of work against a resource

Serializer
  transform hydrated ORM instances into JSON representations over the wire, and vice versa

Adapter
  tell the serializers how to interrogate your ORM instances

Filters
  mixed in to run before or after an Action
