import { Controller } from 'denali';

export default class ApplicationController extends Controller {

  index() {
    this.render({ hello: 'world' });
  }

}
