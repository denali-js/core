import { Controller, version } from 'denali';

export default class ApplicationController extends Controller {

  index(req, res) {
    res.json({ denaliVersion: version, message: 'Welcome to Denali!' });
  }

}
