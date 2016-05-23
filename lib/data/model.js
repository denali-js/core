import kebabCase from 'lodash/kebabCase';
import isArray from 'lodash/isArray';
import trimEnd from 'lodash/trimEnd';

export default class Model {

  static get type() {
    return kebabCase(trimEnd(this.name, 'Model'));
  }

  static find(query, options) {
    return this.adapter.find(this.type, query, options)
      .then((records) => {
        if (isArray(records)) {
          return records.map((record) => {
            return new this(record);
          });
        }
        return new this(records);
      });
  }

  static create(data, options) {
    let record = this.adapter.createRecord(this.type, data, options);
    return new this(record);
  }

  static get adapter() {
    return this.container.lookup(`orm-adapter:${ this.name }`);
  }

  get id() { return this.adapter.idFor(this.record); }

  get container() { return this.constructor.container; }

  record = null;

  constructor(data, options) {
    if (!this.constructor.name) {
      throw new Error(`Missing model name for ${ this }: You must either define your model using named classes (i.e. class User extends Model {}) or define a 'name' class property`);
    }
    this.adapter = this.constructor.adapter;
    this.record = this.adapter.buildRecord(this.constructor.type, data, options);
    return new Proxy(this, {
      get(model, property) {
        let descriptor = model.constructor[property];
        if (descriptor && descriptor.isAttribute) {
          return model.adapter.getAttribute(model.record, property);
        } else if (descriptor && descriptor.isRelationship) {
          return model.adapter.getRelationship(model.record, property).then((results) => {
            if (descriptor.type === 'hasMany') {
              return new RelatedSet(model, results);
            }
            let RelatedModel = this.modelFor(descriptor.relatedType);
            return new RelatedModel(results);
          });
        }
        return model[property];
      },
      set(model, property) {
        let descriptor = model.constructor[property];
        if (descriptor && descriptor.isAttribute) {
          return model.adapter.setAttribute(model.record, property);
        } else if (descriptor && descriptor.isRelationship) {
          return model.adapter.setRelationship(model.record, property);
        }
        return model[property];
      },
      deleteProperty(model, property) {
        let descriptor = model.constructor[property];
        if (descriptor && descriptor.isAttribute) {
          return model.adapter.deleteAttribute(model.record, property);
        } else if (descriptor && descriptor.isRelationship) {
          return model.adapter.deleteRelationship(model.record, property);
        }
        return delete model[property];
      }
    });
  }

  save(options) {
    return this.adapter.saveRecord(this.record, options).return(this);
  }

  delete(options) {
    return this.adapter.deleteRecord(this.record, options);
  }

  modelFor(type) {
    return this.container.lookup(`model:${ type }`);
  }

  service(type) {
    return this.container.lookup(`service:${ type }`);
  }

}
