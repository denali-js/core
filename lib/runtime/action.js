import CoreObject from 'core-object';
import assign from 'lodash/object/assign';
import assert from 'assert';

export default CoreObject.extend({

  render() {
    this._rendered = true;
    return this.response.render(...arguments);
  },

  _run() {
    let params = assign({}, this.request.query, this.request.body);
    let responder = this.respond;
    Object.keys(this).forEach((key) => {
      if (this.request.accepts(key)) {
        responder = this[key];
      }
    });
    responder = Promise.method(responder.bind(this));
    return responder(params)
      .then(() => {
        assert(!this._rendered && !this.response.headersSent, `Your action didn't call this.render or finish the request.`);
      }).catch((error) => {
        this.next(error);
      });
  }

});
