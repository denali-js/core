import timing from 'response-time';
import { json } from 'body-parser';
import compression from 'compression';
import cookies from 'cookie-parser';
import cors from 'cors';
import requestid from 'express-request-id';
import forceSSL from 'express-force-ssl';
import logger from 'morgan';
import errorhandler from 'errorhandler';

export default function middleware(router/*, application*/) {

  // Add your own middleware that will execute before Denali:
  // this.use(someMiddlewareFunction);

  // Log out errors in development mode with full stack traces
  if (this.env === 'development') {
    router.use(errorhandler());
  }

  // Add X-Response-Time headers
  router.use(timing());

  // Add X-Request-ID headers
  router.use(requestid());

  // Log out to the console
  if (this.env !== 'test') {
    router.use(logger(this.env === 'development' ? 'dev' : 'combined'));
  }

  // In production, require SSL for all endpoints, and don't respond with 301
  // redirects to the SSL versions if non-SSL is requested.
  if (this.env === 'production') {
    router.use(forceSSL({ enable301Redirects: false }));
  }

  // Use gzip compression for responses
  router.use(compression());

  // Allow cross origin requests from any domain. For additional security, try
  // locking this down to only your frontend domains.
  router.use(cors());

  // Parse cookies on incoming requests.
  // TODO add note about CSRF protection not needed if you don't auth with cookies
  router.use(cookies());

  // Parse any JSON request bodies
  router.use(json({ type: 'application/*+json' }));

}
