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
        if (typeof property === 'string') {
          // Return the attribute value if that's what is requested
          let descriptor = model.constructor[property];
          if (descriptor && descriptor.isAttribute) {
            return model.adapter.getAttribute(model.record, property);
          }
          // Forward relationship related methods to their generic counterparts
          if (/get[A-Z]/.test(property)) {
            let relationship = lowerFirst(property.match(/get(\w+)/)[1]);
            return model.getRelated.bind(model, relationship);
          }
          if (/set[A-Z]/.test(property)) {
            let relationship = lowerFirst(property.match(/set(\w+)/)[1]);
            return model.setRelated.bind(model, relationship);
          }
          if (/add[A-Z]/.test(property)) {
            let relationship = lowerFirst(property.match(/add(\w+)/)[1]);
            return model.addRelated.bind(model, relationship);
          }
          if (/remove[A-Z]/.test(property)) {
            let relationship = lowerFirst(property.match(/remove(\w+)/)[1]);
            return model.removeRelated.bind(model, relationship);
          }
        }
        // It's not an attribute or a relationship method, so let the model
        // respond normally
        return model[property];
      },

      set(model, property) {
        // Set attribute values
        let descriptor = model.constructor[property];
        if (descriptor && descriptor.isAttribute) {
          return model.adapter.setAttribute(model.record, property);
        }
        // Otherwise just set the model property directly
        return model[property];
      },

      deleteProperty(model, property) {
        // Delete the attribute
        let descriptor = model.constructor[property];
        if (descriptor && descriptor.isAttribute) {
          return model.adapter.deleteAttribute(model.record, property);
        }
        // Otherwise just delete the model property directly
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
    return Promise.try(() => this.adapter.saveRecord(this.record, options))
      .return(this);
  }

  /**
   * Delete this model.
   *
   * @method delete
   * @param options {Object} ORM-specific options
   * @return {Promise}
   */
  delete(options) {
    return Promise.try(() => this.adapter.deleteRecord(this.record, options));
  }

  /**
   * Returns the related record(s) for the given relationship.
   *
   * @method getRelated
   * @param relationshipName {String}
   * @param options {Object} ORM-specific options
   * @return {Promise} resolves with the related model (for hasOne
   * relationships), or an array of models (for hasMany relationships)
   */
  getRelated(relationshipName, options) {
    let descriptor = this.constructor[relationshipName] || this.constructor[pluralize(relationshipName)];
    return Promise.try(() => this.adapter.getRelated(this.record, relationshipName, descriptor, options))
      .then((results) => {
        let RelatedModel = this.modelFor(descriptor.type);
        if (descriptor.mode === 'hasOne') {
          return new RelatedModel(results);
        }
        return results.map((record) => new RelatedModel(record));
      });
  }

  /**
   * Replaces the related records for the given relationship with the supplied
   * related records.
   *
   * @method setRelated
   * @param relationshipName {String}
   * @param relatedModels {Object|Array}
   * @param options {Object} ORM-specific options
   * @return {Promise} resolves once the change is persisted
   */
  setRelated(relationshipName, relatedModels, options) {
    let descriptor = this.constructor[relationshipName] || this.constructor[pluralize(relationshipName)];
    let relatedRecords = relatedModels.map((model) => model.record);
    return Promise.try(() => this.adapter.setRelated(this.record, relationshipName, descriptor, relatedRecords, options));
    // TODO force a null return?
  }

  /**
   * Add a related record to a hasMany relationship.
   *
   * @method addRelated
   * @param relationshipName {String}
   * @param relatedModel {Object}
   * @param options {Object} ORM-specific options
   * @return {Promise} resolves once the change has been persisted
   */
  addRelated(relationshipName, relatedModel, options) {
    let descriptor = this.constructor[relationshipName] || this.constructor[pluralize(relationshipName)];
    return Promise.try(() => this.adapter.addRelated(this.record, relationshipName, descriptor, relatedModel, options))
      .then((results) => {
        let RelatedModel = this.modelFor(descriptor.type);
        return results.map((record) => new RelatedModel(record));
      });
  }

  /**
   * Remove the given record from the hasMany relationship
   *
   * @method removeRelated
   * @param relationshipName {String}
   * @param relatedModel {Object}
   * @param options {Object} ORM-specific options
   * @return {Promise} resolves once the change is persisted
   */
  removeRelated(relationshipName, relatedModel) {
    let descriptor = this.constructor[relationshipName] || this.constructor[pluralize(relationshipName)];
    return Promise.try(() => this.adapter.removeRelated(this.record, relationshipName, descriptor, relatedModel, options))
      .then((results) => {
        let RelatedModel = this.modelFor(descriptor.type);
        return new RelatedSet(RelatedModel, results);
      });
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
