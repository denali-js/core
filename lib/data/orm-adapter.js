export default class ORMAdapter {

  static find(/* type, query, options */) {
    throw new Error('You must implement this method');
  }

  static createRecord(/* type, data, options */) {
    throw new Error('You must implement this method');
  }

  static idFor(/* record */) {
    throw new Error('You must implement this method');
  }

  static getAttribute(/* record, property */) {
    throw new Error('You must implement this method');
  }

  static setAttribute(/* record, property */) {
    throw new Error('You must implement this method');
  }

  static deleteAttribute(/* record, property */) {
    throw new Error('You must implement this method');
  }

  static getRelationship(/* record, relationship */) {
    throw new Error('You must implement this method');
  }

  static setRelationship(/* record, relationship */) {
    throw new Error('You must implement this method');
  }

  static deleteRelationship(/* record, relationship */) {
    throw new Error('You must implement this method');
  }

  static saveRecord(/* record, options */) {
    throw new Error('You must implement this method');
  }

  static deleteRecord(/* record, options */) {
    throw new Error('You must implement this method');
  }

  static define(/* Model */) {
    throw new Error('You must implement this method');
  }

}

