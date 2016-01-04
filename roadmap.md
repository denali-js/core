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
- [x] test helpers
- [x] install command


* add normalization to blackburn
  * support hydrating into ORM instances
  * normalize keys
* testing framework
  * generate tests from action classes
  * addon testing
* create stack trace link addon
* Get uglify / linting trees working
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
* extract eslint styles to preset dependency
* support arbitrary blueprint sources (i.e. local folders, git urls)
