export default class Model {

  static get type() { return this.name.toLowerCase; }

  static find(query, options) {
    return this.adapter.find(this.type, query, options);
  }

  static create(data) {
    let record = this.adapter.createRecord(this.type, data, options);
    return new this(record);
  }

  static get adapter() { return this.container.lookup('orm-adapters:' + this.name); }

  get id() { return this.adapter.idFor(record.id); }

  get container() { return this.constructor.container; }

  record = null;

  constructor(record, options) {
    if (!this.name) {
      throw new Error('You must either define your model using named classes (i.e. class User extends Model {}) or define a `name` class property');
    }
    return new Proxy(this, {
      get(model, property) {
        let descriptor = model.constructor[property];
        if (descriptor.isAttribute) {
          return model.adapter.getAttribute(model.record, property);
        } else if (descriptor.isRelationship) {
          return model.adapter.getRelationship(model.record, property).then((results) => {
            if (descriptor.type === 'hasMany') {
              return new RelatedSet(model, results);
            } else {
              let RelatedModel = this.modelFor(descriptor.relatedType);
              return new RelatedModel(results);
            }
          });
        }
        return model[property];
      },
      set(model, property) {
        let descriptor = model.constructor[property];
        if (descriptor.isAttribute) {
          return model.adapter.setAttribute(model.record, property);
        } else if (descriptor.isRelationship) {
          return model.adapter.setRelationship(model.record, property);
        }
        return model[property];
      },
      deleteProperty(model, property) {
        let descriptor = model.constructor[property];
        if (descriptor.isAttribute) {
          return model.adapter.deleteAttribute(model.record, property);
        } else if (descriptor.isRelationship) {
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
