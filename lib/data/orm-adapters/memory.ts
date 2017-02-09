import {
  find,
  filter,
  map,
  remove,
  values
} from 'lodash';
import ORMAdapter from '../orm-adapter';
import Model from '../model';
import { RelationshipDescriptor } from '../descriptors';
import assert from 'assert';

let guid = 0;

export default class MemoryAdapter extends ORMAdapter {

  _cache: { [type: string]: { [id: number]: any } } = {};

  _cacheFor(type: string): { [id: number]: any } {
    if (!this._cache[type]) {
      this._cache[type] = {};
    }
    return this._cache[type];
  }

  async find(type: string, id: number | string): Promise<any> {
    return find(this._cacheFor(type), id);
  }

  async findOne(type: string, query: any): Promise<any> {
    return find(this._cacheFor(type), query);
  }

  async all(type: string): Promise<any[]> {
    return values(this._cacheFor(type));
  }

  async query(type: string, query: any): Promise<any[]> {
    return filter(this._cacheFor(type), query);
  }

  buildRecord(type: string, data: any): any {
    this._cacheFor(type);
    return data;
  }

  idFor(model: Model) {
    return model.record.id;
  }

  setId(model: Model, value: number) {
    let collection = this._cacheFor(model.type);
    delete collection[model.record.id];
    model.record.id = value;
    collection[value] = model.record;
  }

  getAttribute(model: Model, property: string): any {
    return model.record[property];
  }

  setAttribute(model: Model, property: string, value: any): true {
    model.record[property] = value;
    return true;
  }

  deleteAttribute(model: Model, property: string): true {
    model.record[property] = null;
    return true;
  }

  async getRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, query: any): Promise<any|any[]> {
    let relatedCollection = this._cacheFor(descriptor.type);
    if (descriptor.mode === 'hasMany') {
      return filter(relatedCollection, (relatedRecord: any) => {
        return model.record[`${ relationship }_ids`].contains(relatedRecord.id);
      });
    }
    return this.findOne(descriptor.type, { id: model.record[`${ relationship }_id`] });
  }

  async setRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, relatedRecords: any|any[]): Promise<void> {
    if (Array.isArray(relatedRecords)) {
      assert(descriptor.mode === 'hasMany', `You tried to set ${ relationship } to an array of related records, but it is a hasOne relationship`);
      model.record[`${ relationship }_ids`] = map(relatedRecords, 'id');
    } else {
      model.record[`${ relationship }_id`] = relatedRecords.id;
    }
  }

  async addRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, relatedRecord: any): Promise<void> {
    model.record[`${ relationship }_ids`].push(relatedRecord.id);
  }

  async removeRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, relatedRecord: any): Promise<void> {
    remove(model.record[`${ relationship }_ids`], { id: relatedRecord.id });
  }

  async saveRecord(model: Model): Promise<void> {
    let collection = this._cacheFor(model.type);
    if (model.record.id == null) {
      guid += 1;
      model.record.id = guid;
    }
    collection[model.record.id] = model.record;
    return model.record;
  }

  async deleteRecord(model: Model): Promise<void> {
    let collection = this._cacheFor(model.type);
    delete collection[model.record.id];
  }

  async defineModels() {}

}
