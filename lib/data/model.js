/**
 * @module denali
 * @submodule data
 */
import kebabCase from 'lodash/kebabCase';
import isArray from 'lodash/isArray';
import trimEnd from 'lodash/trimEnd';

/**
 * The Model class is the core of Denali's unique approach to data and ORMs.
 * It acts as a wrapper and translation layer that provides a unified interface
 * to access and manipulate data, but translates those interactions into ORM
 * specific operations via ORM adapters.
 *
 * Models are able to maintain their relatively clean interface thanks to the
 * way the constructor actually returns a Proxy which wraps the Model instance,
 * rather than the Model instance directly. This means you can directly get and
 * set properties on your records, and the record (which is a Proxy-wrapped
 * Model) will translate and forward those calls to the underlying ORM adapter.
 *
 * @class Model
 * @constructor
 */
export default class Model {

  /**
   * The type of the Model class. This string is used as the container name for
   * the model, as well as in several other areas of Denali (i.e. serializers,
   * ORM adapters, etc). Conventionally, types are dasherized versions of the
   * model name (i.e. the BlogPost model's type would be `"blog-post"`).
   *
   * @property type
   * @static
   * @type {String}
   */
  static get type() {return kebabCase(trimEnd(this.name, 'Model')); }

  /**
   * Find records by id, basic query, or query function.
   *
   * You can find single records by passing in the id:
   *
   *     BlogPost.find(1)
   *
   * You can query records using basic query syntax:
   *
   *     BlogPost.find({ title: 'foobar' })
   *
   * For more complex queries, you can use a query function to leverage the
   * specific syntax and strengths of your ORM and data store:
   *
   *     BlogPost.find((sql) => {
   *       return sql.where({ title: 'foobar' })
   *         .greaterThan('view_count', 10);
   *     });
   *
   * @method find
   * @static
   * @param query {Number|String|Object|Function}
   * @param options {Object} ORM-specific options
   * @return {Promise} resolves with the record(s) found, an empty array, or
   * null
   */
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

  /**
   * Create a new record and immediately persist it.
   *
   * @method create
   * @static
   * @param data {Object}
   * @param options {Object}
   * @return {Promise} resolves with the newly created record
   */
  static create(data, options) {
    return this.adapter.createRecord(this.type, data, options)
      .then((record) => {
        return new this(record);
      });
  }

  /**
   * The ORM adapter specific to this model type. Defaults to the application's
   * ORM adapter if none for this specific model type is found.
   *
   * @property adapter
   * @static
   * @type {ORMAdapter}
   * @private
   */
  static get adapter() {
    return this.container.lookup(`orm-adapter:${ this.type }`);
  }

  /**
   * The id of the record
   *
   * @property id
   * @type {Number|String}
   */
  get id() { return this.adapter.idFor(this.record); }

  /**
   * The application container
   *
   * @property container
   * @type {Container}
   */
  get container() { return this.constructor.container; }

  /**
   * The ORM adapter specific to this model type. Defaults to the application's
   * ORM adapter if none for this specific model type is found.
   *
   * @property adapter
   * @type {ORMAdapter}
   */
  get adapter() { return this.constructor.adapter; }

  /**
   * The underlying ORM adapter record. An opaque value to Denali, handled
   * entirely by the ORM adapter.
   *
   * @property record
   * @type {Object}
   * @private
   */
  record = null;

  constructor(data, options) {
    if (!this.constructor.name) {
      throw new Error(`Missing model name for ${ this }: You must either define your model using named classes (i.e. class User extends Model {}) or define a 'name' class property`);
    }
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

  /**
   * Persist this model.
   *
   * @method save
   * @param options {Object} ORM-specific options
   * @return {Promise}
   */
  save(options) {
    return this.adapter.saveRecord(this.record, options).return(this);
  }

  /**
   * Delete this model.
   *
   * @method delete
   * @param options {Object} ORM-specific options
   * @return {Promise}
   */
  delete(options) {
    return this.adapter.deleteRecord(this.record, options);
  }

  /**
   * Lookup a model class by type.
   *
   * @method modelFor
   * @param type {String}
   * @return {Model}
   */
  modelFor(type) {
    return this.container.lookup(`model:${ type }`);
  }

  /**
   * Lookup a service by type
   *
   * @method service
   * @param type {String}
   * @return {Service}
   */
  service(type) {
    return this.container.lookup(`service:${ type }`);
  }

}
