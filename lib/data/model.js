export default class Model {

  static get type() { return this.name.toLowerCase; }

  static find(query, options) {
    return this.adapter.find(this.name, query, options);
  }

  get adapter() { return this.constructor.container.lookup('orm-adapters:' + this.name); }
  get id() { return this.record.id; }

  record = null;

  constructor(data, options) {
    if (!this.name) {
      throw new Error('You must either define your model using named classes (i.e. class User extends Model {}) or define a `name` class property');
    }

    this.record = this.adapter.createRecord(data, options);

    return new Proxy(this, {
      get(model, property) {
        if (property in model) {
          return model[property];
        }
        return this.adapter.getAttribute(model.record, property);
      },
      set(model, property, value) {
        if (property in model) {
          model[property] = value;
        } else {
          this.adapter.setAttribute(model.record, property, value);
        }
        return value;
      },
      deleteProperty(model, property) {
        if (property in model) {
          return delete model[property];
        }
        this.adapter.deleteAttribute(model.record, property);
        return true;
      }
    });
  }

  saveRecord(options) {
    return this.adapter.saveRecord(this.record, options).then(() => {
      return this;
    });
  }

  deleteRecord(options) {
    return this.adapter.deleteRecord(this.record, options);
  }

  getAttribute(property, options) {
    return this.adapter.getAttribute(this.record, property, options);
  }

  setAttribute(property, value, options) {
    return this.adapter.setAttribute(this.record, property, options);
  }

}
