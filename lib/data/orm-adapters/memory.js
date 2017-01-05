import { filter, pluck, remove } from 'lodash';
import ORMAdapter from '../orm-adapter';

let guid = 0;

export default class MemoryAdapter extends ORMAdapter {

  _cache = {};

  async find(type, query) {
    return filter(this._cache[type] || {}, query);
  }

  async findOne(type, query) {
    if (typeof query === 'number' || typeof query === 'string') {
      return (this._cache[type] && this._cache[type][String(query)]) || null;
    }
    return filter(this._cache[type] || {}, query)[0];
  }

  buildRecord(type, data) {
    this._cache[type] = this._cache[type] || {};
    return data;
  }

  idFor(model) {
    return model.record.id;
  }

  setId(model, value) {
    delete this._cache[model.type][model.record.id];
    model.record.id = value;
    this._cache[model.type][value] = model.record;
  }

  getAttribute(model, property) {
    return model.record[property];
  }

  setAttribute(model, property, value) {
    model.record[property] = value;
    return true;
  }

  deleteAttribute(model, property) {
    model.record[property] = null;
    return true;
  }

  async getRelated(model, relationship, descriptor) {
    let relatedCollection = this._cache[descriptor.type];
    if (descriptor.mode === 'hasMany') {
      return filter(relatedCollection, (relatedRecord) => {
        return model.record[`${ relationship }_ids`].contains(relatedRecord.id);
      });
    }
    return this.findOne(relatedCollection, { id: model.record[`${ relationship }_id`] });
  }

  async setRelated(model, relationship, descriptor, relatedRecords) {
    if (descriptor.mode === 'hasMany') {
      model.record[`${ relationship }_ids`] = pluck(relatedRecords, 'id');
    } else {
      model.record[`${ relationship }_id`] = relatedRecords.id;
    }
  }

  async addRelated(model, relationship, descriptor, relatedRecord) {
    model.record[`${ relationship }_ids`].push(relatedRecord.id);
  }

  async removeRelated(model, relationship, descriptor, relatedRecord) {
    remove(model.record[`${ relationship }_ids`], { id: relatedRecord.id });
  }

  async saveRecord(type, model) {
    let collection = this._cache[type];
    if (model.record.id == null) {
      guid += 1;
      model.record.id = guid;
    }
    collection[model.record.id] = model.record;
    return model.record;
  }

  async deleteRecord(type, model) {
    let collection = this._cache[type];
    delete collection[model.record.id];
  }

}
