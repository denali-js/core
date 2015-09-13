import { Controller, Errors } from 'denali';

export default Controller.extend({

  filters() {
    // this.before('someActionName');
  },

  list(req, res) {
    res.render(new Errors.NotImplemented());
  },

  create(req, res) {
    res.render(new Errors.NotImplemented());
  },

  show(req, res) {
    res.render(new Errors.NotImplemented());
  },

  update(req, res) {
    res.render(new Errors.NotImplemented());
  },

  destroy(req, res) {
    res.render(new Errors.NotImplemented());
  }

});
