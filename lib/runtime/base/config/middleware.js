const defaults = require('lodash/object/defaults');
const defaultsDeep = require('lodash/object/defaultsDeep');

const timing = require('response-time');
const compression = require('compression');
const cookies = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const requestid = require('express-request-id');
const forceSSL = require('express-force-ssl');
const morgan = require('morgan');
const blackburn = require('blackburn');

module.exports = function baseMiddleware(router, application) {

  let config = application.config;

  function isEnabled(prop) {
    return !config[prop] || config[prop] && config[prop].enabled !== false;
  }

  if (isEnabled('timing')) {
    router.use(timing());
  }

  if (isEnabled('requestid')) {
    router.use(requestid());
  }

  if (isEnabled('logging')) {
    let defaultLoggingFormat = application.environment === 'production' ? 'combined' : 'dev';
    let defaultLoggingOptions = {
      skip() { return application.environment === 'test'; }
    };
    let format = (config.logging && config.logging.format) || defaultLoggingFormat;
    let options = defaults(config.logging || {}, defaultLoggingOptions);
    router.use(morgan(format, options));
  }

  if (isEnabled('compression')) {
    router.use(compression());
  }

  if (isEnabled('cookies')) {
    router.use(cookies(config.cookies));
  }

  if (isEnabled('cors')) {
    router.use(cors(config.cors));
  }

  if (isEnabled('csp')) {
    let cspConfig = defaultsDeep(config.csp, {
      directives: { reportUri: '/_report-csp-violations' },
      reportOnly: application.environment === 'development',
      disableAndroid: true
    });
    router.use(helmet.csp(cspConfig));
    if (config.csp && config.csp.useDummyReportingEndpoint) {
      router.post(cspConfig.directives.reportUri, (req, res) => { res.sendStatus(200); });
    }
  }

  if (isEnabled('xssFilter')) {
    router.use(helmet.xssFilter());
  }

  if (isEnabled('frameguard')) {
    router.use(helmet.frameguard());
  }

  if (isEnabled('hidePoweredBy')) {
    router.use(helmet.hidePoweredBy());
  }

  if (isEnabled('ieNoOpen')) {
    router.use(helmet.ieNoOpen());
  }

  if (isEnabled('noSniff')) {
    router.use(helmet.noSniff());
  }

  if (config.ssl && config.ssl.required) {
    router.use((req, res, next) => {
      res.locals = res.locals || {};
      res.locals.forceSSLOptions = { enable301Redirects: config.ssl.redirectToSSL };
      forceSSL(req, res, next);
    });
  }

  router.use(blackburn({
    adapters: application.container.lookup('adapter:*'),
    serializers: application.container.lookup('serializer:*')
  }));

};
