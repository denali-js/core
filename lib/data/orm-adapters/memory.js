import find from 'lodash/find';
import ORMAdapter from '../orm-adapter';

const cache = {};
let guid = 0;

export default class MemoryAdapter extends ORMAdapter {

  static find(type, query, options) {
    if ([ 'number', 'string' ].includes(typeof query)) {
      return (cache[type] && cache[type][query]) || null;
    } else {
      return find(cache[type] || {}, query);
    }
  }

  static createRecord(type, data, options) {
    cache[type] = cache[type] || {};
    if (!data.id) {
      guid += 1;
      data.id = guid;
    }
    cache[type][data.id] = data;
    return data;
  }

  static buildRecord(type, data, options) {
    return data;
  }

  static idFor(record) {
    return record.id;
  }

  static getAttribute(record, property) {
    return record[property];
  }

  static setAttribute(record, property, value) {
    return record[property] = value;
  }

  static deleteAttribute(record, property) {
    return record[property] = null;
  }

  static getRelated(record, relationship, descriptor) {
    let relatedCollection = cache[descriptor.type];
    if (descriptor.mode === 'hasMany') {
      return filter(relatedCollection, (relatedRecord) => {
        return record[`${ relationship }_ids`].contains(relatedRecord.id);
      });
    }
    return find(relatedCollection, { id: record[`${ relationship }_id`] });
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
    return fromNode(record.save.bind(record));
  }

  static deleteRecord(record) {
    return fromNode(record.remove.bind(record));
  }

  static define(Model) {
    let attributes = {};
    forIn(Model, (value, key) => {
      if (value.isAttribute) {
        attributes[this.serializeKey(key)] = this.typeForAttribute(value);
      }
    });
    return this.db.define(Model.type, attributes);
  }

  static defineRelationships(DenaliModel, AdapterModel) {
    let relationships = {};
    forIn(DenaliModel, (value, key) => {
      if (value.isRelationship) {
        relationships[this.serializeKey(key)] = value;
      }
    });
    forEach(relationships, (config, key) => {
      let RelatedAdapterModel = this.adapterModels[config.relatedType];
      if (config.hasOne) {
        AdapterModel.hasOne(key, RelatedAdapterModel);
      } else {
        AdapterModel.hasMany(key, RelatedAdapterModel);
      }
    });
  }

  static serializeKey(key) {
    return snakeCase(key);
  }

  static typeForAttribute(attribute) {
    let type = typeMap[attribute.type];
    assert(type, `"${ attribute.type }" data type is not supported by the node-orm2 adapter. Supported types are: ${ Object.keys(typeMap).join(', ') }`);
    return type;
  }

}



