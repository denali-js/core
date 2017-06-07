import { ORMAdapter } from 'denali';

export default class <%= className %>Adapter extends ORMAdapter {

  /**
   * Find a record by id.
   */
  async find(type, id, options) {
  }

  /**
   * Find a single record that matches the given query.
   */
  async queryOne(type, query, options) {
  }

  /**
   * Find all records of this type.
   */
  async all(type, options) {
  }

  /**
   * Find all records that match the given query.
   */
  async query(type, query, options) {
  }

  /**
   * Return the id for the given model.
   */
  idFor(model) {
  }

  /**
   * Set the id for the given model.
   */
  setId(model, value) {
  }

  /**
   * Build an internal record instance of the given type with the given data. Note that this method
   * should return the internal, ORM representation of the record, not a Denali Model.
   */
  buildRecord(type, data, options) {
  }

  /**
   * Return the value for the given attribute on the given record.
   */
  getAttribute(model, attribute) {
  }

  /**
   * Set the value for the given attribute on the given record.
   *
   * @returns returns true if set operation was successful
   */
  setAttribute(model, attribute, value) {
  }

  /**
   * Delete the value for the given attribute on the given record. The semantics of this may behave
   * slightly differently depending on backend - SQL databases may NULL out the value, while
   * document stores like Mongo may actually delete the key from the document (rather than just
   * nulling it out)
   *
   * @returns returns true if delete operation was successful
   */
  deleteAttribute(model, attribute) {
  }

  /**
   * Return the related record(s) for the given relationship.
   *
   * @param model The model whose related records are being fetched
   * @param relationship The name of the relationship on the model that should be fetched
   * @param descriptor The RelationshipDescriptor of the relationship being fetch
   * @param query An optional query to filter the related records by
   */
  async getRelated(model, relationship, descriptor, query, options) {
  }

  /**
   * Set the related record(s) for the given relationship. Note: for has-many relationships, the
   * entire set of existing related records should be replaced by the supplied records. The old
   * related records should be "unlinked" in their relationship. Whether that results in the
   * deletion of those old records is up to the ORM adapter, although it is recommended that they
   * not be deleted unless the user has explicitly expressed that intent.
   *
   * @param model The model whose related records are being altered
   * @param relationship The name of the relationship on the model that should be altered
   * @param descriptor The RelationshipDescriptor of the relationship being altered
   * @param related The related record(s) that should be linked to the given relationship
   */
  async setRelated(model, relationship, descriptor, related, options) {
  }

  /**
   * Add related record(s) to a hasMany relationship. Existing related records should remain
   * unaltered.
   *
   * @param model The model whose related records are being altered
   * @param relationship The name of the relationship on the model that should be altered
   * @param descriptor The RelationshipDescriptor of the relationship being altered
   * @param related The related record(s) that should be linked to the given relationship
   */
  async addRelated(model, relationship, descriptor, related, options) {
  }

  /**
   * Remove related record(s) from a hasMany relationship. Note: The removed related records should
   * be "unlinked" in their relationship. Whether that results in the deletion of those old records
   * is up to the ORM adapter, although it is recommended that they not be deleted unless the user
   * has explicitly expressed that intent.
   *
   * @param model The model whose related records are being altered
   * @param relationship The name of the relationship on the model that should be altered
   * @param descriptor The RelationshipDescriptor of the relationship being altered
   * @param related The related record(s) that should be removed from the relationship; if not
   *                provided, then all related records should be removed
   */
  async removeRelated(model, relationship, descriptor, related, options) {
  }

  /**
   * Persist the supplied model.
   */
  async saveRecord(model, options) {
  }

  /**
   * Delete the supplied model from the persistent data store.
   */
  async deleteRecord(model, options) {
  }

  /**
   * Takes an array of Denali Models and defines an ORM specific model class, and/or any other ORM
   * specific setup that might be required for that Model.
   */
  // async defineModels(models) {
  // };

  /**
   * Start a transaction that will wrap a test, and be rolled back afterwards. If the data store
   * doesn't support transactions, just omit this method. Only one test transaction will be opened
   * per process, and the ORM adapter is responsible for keeping track of that transaction so it
   * can later be rolled back.
   */
  // async startTestTransaction() {
  // }

  /**
   * Roll back the test transaction.
   */
  // async rollbackTestTransaction() {
  // }

  /**
   * The current test transaction, if applicable
   */
  // testTransaction;

}
