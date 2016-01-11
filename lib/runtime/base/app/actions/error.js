import Action from '../../../action';
import inject from '../../../inject';
import fs from 'fs';
import path from 'path';
import template from 'lodash/string/template';

const errorHTML = fs.readFileSync(path.join(__dirname, '..', 'assets', 'error.html'), 'utf-8');
const errorHTMLTemplate = template(errorHTML, { variable: 'data' });

export default Action.extend({

  config: inject('config:environment'),

  // In case the incoming request doesn't have a Content-type header, it will
  // land here, so default to respondWithJson()
  respond() {
    return this.respondWithJson();
  },

  respondWithHtml() {
    let error = this.prepareError();
    let html = errorHTMLTemplate({ error });
    return this.response.status(error.status || 500).send(html);
  },

  respondWithJson() {
    return this.render(this.prepareError());
  },

  prepareError() {
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
    if (this.application.environment !== 'test') {
      // TODO log request ID as well
      this.log('error', error.stack || error.message);
    }
    return error;
  },

  includeDebugInfo() {
    return this.config.logging && this.config.logging.showDebuggingInfo;
  },

  // Override the default logging method to include the original action's
  // name, not the error action's name
  log(level, ...msg) {
    return this.application.log(level, `[action:${ this.originalAction }]`, ...msg);
  }

});
