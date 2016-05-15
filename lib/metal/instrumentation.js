import EventEmitter from 'events';
import Promise from 'bluebird';

export default {

  _emitter: new EventEmitter(),

  subscribe() {
    this._emitter.on(...arguments);
  },

  unsubscribe() {
    this._emitter.removeListener(...arguments);
  },

  instrument(eventName, data, workFn) {
    let startTime;
    return new Promise((resolve) => {
      startTime = process.hrtime()[1];
      resolve(workFn());
    }).tap((result) => {
      let endTime = process.hrtime()[1];
      let duration = (endTime - startTime) / 100;
      this._emitter.emit(eventName, data, result, duration);
    });
  }

};
