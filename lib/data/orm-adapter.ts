import DenaliObject from '../metal/object';
import Model from './model';
import { RelationshipDescriptor } from './descriptors';

/**
 * The ORMAdapter class is responsible for enabling Denali to communicate with
 * the ORM of your choice. It does this by boiling down the possible actions
 * that a user might before against a Model that would involve persistence into
 * a set of basic operations. Your adapter then implements these operations, and
 * Denali can build on top of that.
 *
 * @export
 * @class ORMAdapter
 * @extends {DenaliObject}
 * @module denali
 * @submodule data
 */
abstract class ORMAdapter extends DenaliObject {

  /**
   * Find a record by ID, basic query, or adapter-specific query.
   *
   * To find a single record by it's id, just call:
   *
   *     Post.find(1)
   *
   * Denali also allows users to supply simple queries in a universal format
   * of an object with properties:
   *
   *     Post.find({ title: 'foo' })
   *
   * This allows basic querying regardless of the ORM used. However, for more
   * advanced use cases, rather than trying to design a single interface that
   * could support all ORMs, Denali simply defers to ORM specific syntax via
   * a query function:
   *
   *     Post.find((myQueryBuilder) => {
   *       return myQueryBuilder.foo('bar');
   *     });
   *
   * This approach allows you to provide ultimately flexibility for querying
   * (the arguments to the query function are supplied by you and can be ORM
   * specific).
   *
   * The `options` argument allows for additional, orthogonal options in case
   * your ORM needs it. It's treated as an opaque, pass through value by Deanli.
   *
   * @abstract
   * @param {string} type
   * @param {*} id
   * @param {*} options
   * @returns {Promise<any>}
   */
  abstract find(type: string, id: any, options: any): Promise<any>;

  abstract findOne(type: string, query: any, options: any): Promise<any>;

  abstract all(type: string, options: any): Promise<any[]>;

  abstract query(type: string, query: any, options: any): Promise<any[]>;

  /**
   * Return the id for the given record.
   *
   * @abstract
   * @param {Model} model
   * @returns {*}
   */
  abstract idFor(model: Model): any;

  abstract setId(model: Model, value: any): void;

  abstract buildRecord(type: string, data: any, options: any): any;

  /**
   * Return the value for the given attribute on the given record.
   *
   * @abstract
   * @param {Model} model
   * @param {string} attribute
   * @returns {*}
   */
  abstract getAttribute(model: Model, attribute: string): any;

  /**
   * Set the value for the given attribute on the given record.
   *
   * @abstract
   * @param {Model} model
   * @param {string} attribute
   * @param {*} value
   * @returns {boolean} should return true if set operation was successful
   */
  abstract setAttribute(model: Model, attribute: string, value: any): boolean;

  /**
   * Delete the value for the given attribute on the given record. The
   * semantics of this may behave slightly differently depending on backend -
   * SQL databases may NULL out the value, while document stores like Mongo may
   * actually delete the key from the document (rather than just nulling it out)
   *
   * @abstract
   * @param {Model} model
   * @param {string} attribute
   * @returns {boolean} should return true if delete operation was successful
   */
  abstract deleteAttribute(model: Model, attribute: string): boolean;

  /**
   * Return the related record(s) for the given relationship.
   *
   * @abstract
   * @param {Model} model
   * @param {string} relationship
   * @param {RelationshipDescriptor} descriptor
   */
  abstract getRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, query: any, options: any): Promise<any|any[]>;

  /**
   * Set the related record(s) for the given relationship.
   *
   * @abstract
   * @param {Model} model
   * @param {string} relationship
   * @param {RelationshipDescriptor} descriptor
   * @param {*} related
   */
  abstract setRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, related: any, options: any): Promise<void>;

  /**
   * Add a related record to a hasMany relationship.
   *
   * @abstract
   * @param {Model} model
   * @param {string} relationship
   * @param {RelationshipDescriptor} descriptor
   * @param {*} related
   */
  abstract addRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, related: Model|Model[], options: any): Promise<void>;

  /**
   * Remove a related record from a hasMany relationship.
   *
   * @abstract
   * @param {Model} model
   * @param {string} relationship
   * @param {RelationshipDescriptor} descriptor
   * @param {*} related
   */
  abstract removeRelated(model: Model, relationship: string, descriptor: RelationshipDescriptor, related:Model|Model[], options: any): Promise<void>;

  /**
   * Persist the supplied record.
   *
   * @abstract
   * @param {Model} model
   * @param {*} options
   */
  abstract saveRecord(model: Model, options: any): Promise<void>;

  /**
   * Delete the supplied record from the persistent data store.
   *
   * @abstract
   * @param {Model} model
   * @param {*} options
   */
  abstract deleteRecord(model: Model, options: any): Promise<void>;

  /**
   * Takes a Denali Model class and defines an ORM specific model class, and/or
   * any other ORM specific setup that might be required for that Model.
   *
   * @abstract
   * @param {Model[]} models
   */
  abstract defineModels(models: Model[]): Promise<void>;

}

export default ORMAdapter;
