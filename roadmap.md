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
  * special error actions? per folder, app wide? or handle errors in the action itself?
  * most errors should result in output, not crashing, ideally
  * serve html error page to browsers with additional details in dev
* deploy command / pipeline
* generic caching layer with pluggable backing stores
* jobs
* mailers?
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
* security review / audit
* custom commands / tasks that an app or addon can add to denali cli
* extract eslint styles to preset dependency
* support arbitrary blueprint sources (i.e. local folders, git urls)

-----

Do adapters belong in config/ or app/?
