import Action, { ActionOptions } from '../../lib/runtime/action';
import Response from '../../lib/runtime/response';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  template
} from 'lodash';
import * as createDebug from 'debug';

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

  constructor(options: ActionOptions & { error: any }) {
    super(options);
    this.error = options.error;
  }

  /**
   * Respond with JSON by default
   */
  public respond(): Response {
    return this.respondWithJson();
  }

  /**
   * Render an HTML template with the error details
   */
  public respondWithHtml(): Response {
    let response = this.prepareError();
    let html = errorHTMLTemplate({ error: response.body });
    return new Response(response.status || 500, html, { contentType: 'text/html', raw: true });
  }

  /**
   * Render the error details as a JSON payload
   */
  public respondWithJson(): Response {
    debug('Client requested JSON, preparing error as JSON payload');
    return this.prepareError();
  }

  /**
   * Prepare the error for rendering. Santize the details of the error in production.
   */
  protected prepareError(): Response {
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

  /**
   * Should the response include details about the error (i.e. a full stack trace)?
   */
  protected includeDebugInfo(): boolean {
    return this.config.logging && this.config.logging.showDebuggingInfo;
  }

}
