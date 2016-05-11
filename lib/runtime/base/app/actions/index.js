import Action from '../../../action';
import Response from '../../../response';
import fs from 'fs';
import path from 'path';
import template from 'lodash/template';

const indexHTML = fs.readFileSync(path.join(__dirname, '..', 'assets', 'index.html'), 'utf-8');
const indexHTMLTemplate = template(indexHTML, { variable: 'data' });

export default class IndexAction extends Action {

  respond() {
    return this.respondWithJson();
  }

  respondWithHtml() {
    let html = indexHTMLTemplate(this.config);
    return this.response.status(200).send(html);
  }

  respondWithJson() {
    return new Response(200, { hello: 'world' }, { raw: true });
  }

}
