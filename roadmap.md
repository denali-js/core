- [x] preprocessor support w/ sourcemap support
- [x] precompile & minify prod builds
- [x] default logger with swappable interface
- [x] addon loading & config
- [x] content negotiation for actions
- [x] default CSP, CORS, frame-jacking headers and config
- [x] containers lookup in child addons if not found
   - [x] add default lookups for error route
- [x] settle on engine vs addon
- [x] addon blueprints


* add normalization to blackburn
  * support hydrating into ORM instances
  * normalize keys
* testing framework
  * database mock?
  * mocking services
  * test helpers
  * generate tests from action classes
  * addon testing
  * create stack trace link addon

* find heroku addons, build addons for those saas services
  * postgres
  * sequelize models
  * bookshelf models
  * mongo
  * mongoose models
  * redis
  * mysql
  * newrelic
  * librato
  * papertrail
  * logentries
  * mailchimp / mandril
  * sendgrid
  * rollbar
  * elasticsearch
  * keen
  * pubnub
  * statuspage
  * ci's? i.e. circle, travis, codeship?
  * stripe
* ssl?
* load testing
* error handling
  * special error actions? per folder, app wide?
  * most errors should result in output, not crashing, ideally
  * serve html error page to browsers, with additional details in dev
* deploy command / pipeline

Delayed
* jobs
* allow additional debug options (via REPL?)
  * allow it to start in debug mode, or to send a SIG to the process to trigger
    debug mode
  * use blessed to create gui/admin style interface in terminal
    * can trigger it on stdio (for dev mode) or via telnet (for staging/prod)
  * instead of terminal UI, serve a browser UI on an out-of-band server in dev
    mode that shows an API console, debug options, etc interface
* docs command
  * swagger-like (or actually swagger) generation?
  * show API browser / console for text/html requests (i.e. in browser) via addon
* install command
* extract eslint styles to preset dependency
* support arbitrary blueprint sources (i.e. local folders, git urls)





Application
  bootstraps everything
  global aspects:
    transports (once a transport is included, it's there for everyone)

Engine
  loading
  addons/addons
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


# TODO
Add a prop to the base Filter class, make sure it's usable on the action it's
mixed into. Need to make sure the mixin.prototype switch pulls in the stuff
from higher up the proto chain
