module.exports = class AdapterWrappedRecord {

  constructor(adapter, record) {
    this.adapter = adapter;
    this.record = record;
  }

  save(options) {
    return this.adapter.saveRecord(this.record, options).then(() => {
      return this.record;
    });
  }

  delete(options) {
    return this.adapter.deleteRecord(this.record, options);
  }

  get(attribute, options) {
    return this.adapter.getAttribute(this.record, attribute, options);
  }

  set(attribute, value, options) {
    return this.adapter.setAttribute(this.record, attribute, value, options);
  }

};
