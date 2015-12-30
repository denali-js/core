import DenaliObject from './object';
import Promise from 'bluebird';
import assign from 'lodash/object/assign';
import capitalize from 'lodash/string/capitalize';
import assert from 'assert';

export default DenaliObject.extend({

  render() {
    this._rendered = true;
    return this.response.render(...arguments);
  },

  run() {
    let params = assign({}, this.request.query, this.request.body);
    let responder = this.respond;
    assert(typeof responder === 'function', `Your '${ this.name }' must define a respond method!`);
    if (this.request.get('accept') !== '*/*') {
      let availableFormats = [];
      /* eslint-disable guard-for-in */
      for (let key in this) {
        if (/^respondWith/.test(key)) {
          let format = key.match(/respondWith(.+)/)[1].toLowerCase();
          availableFormats.push(format);
        }
      }
      /* eslint-enable guard-for-in */
      if (availableFormats.length > 0) {
        let bestFormat = this.request.accepts(availableFormats);
        if (bestFormat) {
          responder = this['respondWith' + capitalize(bestFormat)];
        }
      }
    }
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
