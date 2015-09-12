import { Controller, Errors } from 'denali';

export default Controller.extend({

  filters() {
    // this.before('someActionName');
  },

  list() {
    res.render(new Errors.NotImplemented());
  },

  create() {
    res.render(new Errors.NotImplemented());
  },

  show() {
    res.render(new Errors.NotImplemented());
  },

  update() {
    res.render(new Errors.NotImplemented());
  },

  destroy() {
    res.render(new Errors.NotImplemented());
  }

});
