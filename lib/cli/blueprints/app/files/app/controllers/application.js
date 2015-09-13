import { Controller } from 'denali';

export default class ApplicationController extends Controller {

  index(req, res) {
    res.json({ hello: 'world' });
  }

}
