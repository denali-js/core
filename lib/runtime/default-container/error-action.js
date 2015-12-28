import Action from '../action';
import fs from 'fs';
import path from 'path';
import template from 'lodash/string/template';

const errorHTML = fs.readFileSync(path.join(__dirname, 'error-template.html'), 'utf-8');
const errorHTMLTemplate = template(errorHTML, { variable: 'error' });

export default Action.extend({

  respond() {
    try {
      return this.respondWithHTML();
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

  respondWithHTML() {
    return this.response.status(this.error.status || 500).send(errorHTMLTemplate(this.error));
  },

  respondWithJSON() {
    return this.response.status(this.error.status || 500).json(this.error);
  }

});
