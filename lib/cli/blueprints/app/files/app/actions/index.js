import { Response } from 'denali';
import ApplicationAction from './application';

export default class IndexAction extends ApplicationAction {

  respond() {
    return new Response(200, {
      message: 'Welcome to Denali!'
    }, { raw: true });
  }

}
