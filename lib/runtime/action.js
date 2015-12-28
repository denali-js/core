import CoreObject from 'core-object';
import Promise from 'bluebird';
import assign from 'lodash/object/assign';

export default CoreObject.extend({

  render() {
    this._rendered = true;
    return this.response.render(...arguments);
  },

  run() {
    assign(this, this.services);
    let params = assign({}, this.request.query, this.request.body);
    let responder = this.respond;
    Object.keys(this)
      .filter((key) => { return /^respondWith/.test(key); })
      .forEach((key) => {
        let format = key.match(/respondWith(.+)/)[1];
        if (this.request.accepts(format.toLowerCase())) {
          responder = this[key];
        }
      });
    responder = Promise.method(responder.bind(this));
    return responder(params)
      .then(() => {
        if (!(this._rendered || this.response.headersSent)) {
          this.next('You failed to finish your request. This is most likely caused by either failing to call `this.render()`, failing to return the promise which will eventually call `this.render()`, or failing to call this.response.send/json/etc');
        }
      }).catch((error) => {
        this.next(error);
      });
  },

  log(level, ...msg) {
    return this.application.log(level, `[action:${ this.name }]`, ...msg);
  }

});
