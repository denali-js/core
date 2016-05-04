module.exports = class Store {

  find(type, query, options) {
    let adapter = this.adapterForType(type);
    return adapter.find(type, query, options).then((result) => {
      if (isArray(result)) {
        return result.map((record) => {
          new AdapterWrappedRecord(adapter, record);
        });
      }
      return new AdapterWrappedRecord(adapter, record);
    });
  }

  create(type, properties) {
    let adapter = this.adapterForType(type);
    return adapter.create(type, properties).then((createdRecord) => {
      return new AdapterWrappedRecord(adapter, record);
    });
  }

  adapterForType(type) {
    return this.container.lookup(`adapters:${type}`);
  }

};
