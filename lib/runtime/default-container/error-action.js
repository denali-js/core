import Action from '../action';
import fs from 'fs';
import path from 'path';
import template from 'lodash/string/template';

const errorHTML = fs.readFileSync(path.join(__dirname, 'error-template.html'), 'utf-8');
const errorHTMLTemplate = template(errorHTML, { variable: 'data' });

export default Action.extend({

  respond() {
    this.error.action = this.request.originalAction;
    try {
      return this.respondWithJson();
    } catch (error) {
      this.log('error', 'Error encountered while rendering the error action response:');
      this.log('error', error.stack || error);
      this.log('error', `Original error (from action:${ this.originalAction }):`);
      this.log('error', this.error.stack || this.error);
      if (!this.response.headersSent) {
        this.response.sendStatus(500);
      }
    }
  },

  respondWithHtml() {
    this.error.action = this.request.originalAction;
    let html = errorHTMLTemplate({ error: this.error });
    return this.response.status(this.error.status || 500).send(html);
  },

  respondWithJson() {
    this.error.action = this.request.originalAction;
    let error = JSON.stringify({
      message: this.error.message,
      stacktrace: this.error.stack,
      source: this.error.action
    }, null, 2);
    return this.response.status(this.error.status || 500).send(error);
  }

});
