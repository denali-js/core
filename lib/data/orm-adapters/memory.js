import { filter, pluck, remove } from 'lodash';
import ORMAdapter from '../orm-adapter';

const cache = {};
const typeKey = Symbol('memory-adapter-type');
let guid = 0;

export default class MemoryAdapter extends ORMAdapter {

  static find(type, query) {
    if (typeof query === 'number' || typeof query === 'string') {
      return (cache[type] && cache[type][query]) || null;
    }
    return filter(cache[type] || {}, query);
  }

  static buildRecord(type, data) {
    cache[type] = cache[type] || {};
    data[typeKey] = type;
    return data;
  }

  static idFor(record) {
    return record.id;
  }

  static getAttribute(record, property) {
    return record[property];
  }

  static setAttribute(record, property, value) {
    record[property] = value;
    return true;
  }

  static deleteAttribute(record, property) {
    record[property] = null;
  }

  static getRelated(record, relationship, descriptor) {
    let relatedCollection = cache[descriptor.type];
    if (descriptor.mode === 'hasMany') {
      return filter(relatedCollection, (relatedRecord) => {
        return record[`${ relationship }_ids`].contains(relatedRecord.id);
      });
    }
    return this.find(relatedCollection, { id: record[`${ relationship }_id`] });
  }

  static setRelated(record, relationship, descriptor, relatedRecords) {
    if (descriptor.mode === 'hasMany') {
      record[`${ relationship }_ids`] = pluck(relatedRecords, 'id');
    } else {
      record[`${ relationship }_id`] = relatedRecords.id;
    }
  }

  static addRelated(record, relationship, descriptor, relatedRecord) {
    record[`${ relationship }_ids`].push(relatedRecord.id);
  }

  static removeRelated(record, relationship, descriptor, relatedRecord) {
    remove(record[`${ relationship }_ids`], { id: relatedRecord.id });
  }

  static saveRecord(record) {
    let collection = cache[record[typeKey]];
    if (record.id == null) {
      guid += 1;
      record.id = guid;
    }
    collection[record.id] = record;
    return record;
  }

  static deleteRecord(record) {
    let collection = cache[record[typeKey]];
    delete collection[record.id];
  }

}
