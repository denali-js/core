import Action, { ActionOptions } from '../../lib/runtime/action';
import Response from '../../lib/runtime/response';
import fs from 'fs';
import path from 'path';
import {
  template
} from 'lodash';
import createDebug from 'debug';

const debug = createDebug('denali:app:error-action');

const errorHTML = fs.readFileSync(path.join(__dirname, '..', 'assets', 'error.html'), 'utf-8');
const errorHTMLTemplate = template(errorHTML, { variable: 'data' });

export default class ErrorAction extends Action {

  get originalAction() {
    return this.request._originalAction;
  }

  constructor(options: ActionOptions & { error: any }) {
    super(options);
    this.error = options.error;
  }

  // In case the incoming request doesn't have a Content-type header, it will
  // land here, so default to respondWithJson()
  respond(): Response {
    return this.respondWithJson();
  }

  respondWithHtml(): Response {
    let response = this.prepareError();
    let html = errorHTMLTemplate({ error: response.body });
    return new Response(response.status || 500, html, { contentType: 'text/html', raw: true });
  }

  respondWithJson(): Response {
    debug('Client requested JSON, preparing error as JSON payload');
    return this.prepareError();
  }

  prepareError(): Response {
    let error = this.error;
    // Ensure a default status code of 500
    error.status = error.statusCode = this.error.statusCode || 500;
    // If debugging info is allowed, attach some debugging info to standard
    // locations.
    if (this.includeDebugInfo()) {
      error.meta = {
        stack: this.error.stack,
        action: this.originalAction
      };
    // Otherwise, sanitize the output
    } else {
      if (error.statusCode === 500) {
        error.message = 'Internal Error';
      }
      delete error.stack;
    }
    if (this.config.environment !== 'test') {
      // TODO log request ID as well
      this.logger.error(error.stack || error.message);
    }
    debug('Error prepared: %o', error);
    return new Response(error.status || 500, error, { raw: true });
  }

  includeDebugInfo(): boolean {
    return this.config.logging && this.config.logging.showDebuggingInfo;
  }

}
