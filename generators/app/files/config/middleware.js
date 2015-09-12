import timing from 'response-time';
import { json } from 'body-parser';
import compression from 'compression';
import cookies from 'cookie-parser';
import cors from 'cors';
import requestid from 'express-request-id';
import forceSSL from 'express-force-ssl';
import logger from 'morgan';
import files from 'multipart-json-file-parser';

export default function middleware() {

  // Add your own middleware that will execute before Denali:
  // this.use(someMiddlewareFunction);

  if (this.env === 'production') {
    this.use(forceSSL({ enable301Redirects: false }));
  }
  this.use(timing());
  this.use(requestid());
  this.use(logger(this.env === 'development' ? 'dev' : 'combined'));
  this.use(compression());
  this.use(cors());
  this.use(cookies());
  this.use(json());
  this.use(files());

}
