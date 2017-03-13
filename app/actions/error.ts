import Action, { ActionOptions } from '../../lib/runtime/action';
import Response from '../../lib/runtime/response';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  template
} from 'lodash';
import * as createDebug from 'debug';
import * as assert from 'assert';

const debug = createDebug('denali:app:error-action');

const errorHTML = fs.readFileSync(path.join(__dirname, '..', 'assets', 'error.html'), 'utf-8');
const errorHTMLTemplate = template(errorHTML, { variable: 'data' });

/**
 * The default error action. When Denali encounters an error while processing a request, it will
 * attempt to hand off that error to the `error` action, which can determine how to respond. This is
 * a good spot to do things like report the error to an error-tracking service, sanitize the error
 * response based on environment (i.e. a full stack trace in dev, but limited info in prod), etc.
 *
 * @export
 * @class ErrorAction
 * @extends {Action}
 */
export default class ErrorAction extends Action {

  get originalAction(): string {
    return this.request._originalAction;
  }

  /**
   * Respond with JSON by default
   */
  public respond(params: any): Response {
    return this.respondWithJson(params);
  }

  /**
   * Render an HTML template with the error details
   */
  public respondWithHtml(params: any): Response {
    let response = this.prepareError(params.error);
    let html = errorHTMLTemplate({ error: response.body });
    return new Response(response.status || 500, html, { contentType: 'text/html', raw: true });
  }

  /**
   * Render the error details as a JSON payload
   */
  public respondWithJson(params: any): Response {
    debug('Client requested JSON, preparing error as JSON payload');
    return this.prepareError(params.error);
  }

  /**
   * Prepare the error for rendering. Santize the details of the error in production.
   */
  protected prepareError(error: any): Response {
    assert(error, 'Error action must be invoked with an error as a param');
    if (this.config.environment !== 'test') {
      this.logger.error(error.stack || error.message);
    }
    // Ensure a default status code of 500
    error.status = error.statusCode = error.statusCode || 500;
    // If debugging info is allowed, attach some debugging info to standard
    // locations.
    if (this.includeDebugInfo()) {
      error.meta = {
        stack: error.stack,
        action: this.originalAction
      };
    // Otherwise, sanitize the output
    } else {
      if (error.statusCode === 500) {
        error.message = 'Internal Error';
      }
      delete error.stack;
    }
    debug('Error prepared: %o', error);
    return new Response(error.status || 500, error, { raw: true });
  }

  /**
   * Should the response include details about the error (i.e. a full stack trace)?
   */
  protected includeDebugInfo(): boolean {
    return this.config.logging && this.config.logging.showDebuggingInfo;
  }

}
