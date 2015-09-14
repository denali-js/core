import { Controller, version } from 'denali';

export default Controller.extend({

  index(req, res) {
    res.json({ denaliVersion: version, message: 'Welcome to Denali!' });
  }

});
