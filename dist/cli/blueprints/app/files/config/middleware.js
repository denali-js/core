'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = middleware;

var _responseTime = require('response-time');

var _responseTime2 = _interopRequireDefault(_responseTime);

var _bodyParser = require('body-parser');

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _expressRequestId = require('express-request-id');

var _expressRequestId2 = _interopRequireDefault(_expressRequestId);

var _expressForceSsl = require('express-force-ssl');

var _expressForceSsl2 = _interopRequireDefault(_expressForceSsl);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _errorhandler = require('errorhandler');

var _errorhandler2 = _interopRequireDefault(_errorhandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import files from 'multipart-json-file-parser';

function middleware(router /*, application*/) {

  // Add your own middleware that will execute before Denali:
  // this.use(someMiddlewareFunction);

  // Log out errors in development mode with full stack traces
  if (this.env === 'development') {
    router.use((0, _errorhandler2.default)());
  }

  // Add X-Response-Time headers
  router.use((0, _responseTime2.default)());

  // Add X-Request-ID headers
  router.use((0, _expressRequestId2.default)());

  // Log out to the console
  if (this.env !== 'test') {
    router.use((0, _morgan2.default)(this.env === 'development' ? 'dev' : 'combined'));
  }

  // In production, require SSL for all endpoints, and don't respond with 301
  // redirects to the SSL versions if non-SSL is requested.
  if (this.env === 'production') {
    router.use((0, _expressForceSsl2.default)({ enable301Redirects: false }));
  }

  // Use gzip compression for responses
  router.use((0, _compression2.default)());

  // Allow cross origin requests from any domain. For additional security, try
  // locking this down to only your frontend domains.
  router.use((0, _cors2.default)());

  // Parse cookies on incoming requests.
  // TODO add note about CSRF protection not needed if you don't auth with cookies
  router.use((0, _cookieParser2.default)());

  // Parse any JSON request bodies
  router.use((0, _bodyParser.json)({ type: 'application/*+json' }));

  // TODO files middleware?
  // router.use(files);
}