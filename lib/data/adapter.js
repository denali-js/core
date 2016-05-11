export default class Adapter {

  getAttribute() {
    throw new Error('You must implement the `getAttribute()` method on your ORM adapter');
  }

  setAttribute(record, property) {
    throw new Error('You must implement the `setAttribute()` method on your ORM adapter');
  }

  getRelated() {
    throw new Error(`The ${ this.constructor.name } adapter does not support fetching related records.`);
  }

  deleteAttribute() {
    throw new Error(`The ${ this.constructor.name } adapter does not support deleting attributes.`);
  }

  deleteRecord() {
    throw new Error('You must implement the `deleteRecord()` method on your ORM adapter');
  }

  find() {
    throw new Error('You must implement the `find()` method on your ORM adapter');
  }

  createRecord() {
    throw new Error('You must implement the `createRecord()` method on your ORM adapter');
  }

  saveRecord() {
    throw new Error('You must implement the `deleteRecord()` method on your ORM adapter');
  }

}
