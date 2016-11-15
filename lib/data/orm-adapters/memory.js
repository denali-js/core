import { filter, pluck, remove } from 'lodash';
import ORMAdapter from '../orm-adapter';

let guid = 0;

export default class MemoryAdapter extends ORMAdapter {

  static _cache = {};

  static async find(type, query) {
    return filter(this._cache[type] || {}, query);
  }

  static async findOne(type, query) {
    if (typeof query === 'number' || typeof query === 'string') {
      return (this._cache[type] && this._cache[type][String(query)]) || null;
    }
    return filter(this._cache[type] || {}, query)[0];
  }

  static buildRecord(type, data) {
    this._cache[type] = this._cache[type] || {};
    return data;
  }

  static idFor(model) {
    return model.record.id;
  }

  static setId() {
    throw new Error('Manually supplying id of a model is not supported by the memory adapter');
  }

  static getAttribute(model, property) {
    return model.record[property];
  }

  static setAttribute(model, property, value) {
    model.record[property] = value;
    return true;
  }

  static deleteAttribute(model, property) {
    model.record[property] = null;
  }

  static getRelated(model, relationship, descriptor) {
    let relatedCollection = this._cache[descriptor.type];
    if (descriptor.mode === 'hasMany') {
      return filter(relatedCollection, (relatedRecord) => {
        return model.record[`${ relationship }_ids`].contains(relatedRecord.id);
      });
    }
    return this.find(relatedCollection, { id: model.record[`${ relationship }_id`] });
  }

  static setRelated(model, relationship, descriptor, relatedRecords) {
    if (descriptor.mode === 'hasMany') {
      model.record[`${ relationship }_ids`] = pluck(relatedRecords, 'id');
    } else {
      model.record[`${ relationship }_id`] = relatedRecords.id;
    }
  }

  static addRelated(model, relationship, descriptor, relatedRecord) {
    model.record[`${ relationship }_ids`].push(relatedRecord.id);
  }

  static removeRelated(model, relationship, descriptor, relatedRecord) {
    remove(model.record[`${ relationship }_ids`], { id: relatedRecord.id });
  }

  static async saveRecord(type, model) {
    let collection = this._cache[type];
    if (model.record.id == null) {
      guid += 1;
      model.record.id = guid;
    }
    collection[model.record.id] = model.record;
    return model.record;
  }

  static async deleteRecord(type, model) {
    let collection = this._cache[type];
    delete collection[model.record.id];
  }

}
