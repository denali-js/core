import * as assert from 'assert';
import { singularize } from 'inflection';
import Serializer from '../serializer';
import Model from '../model';
import Response from '../../runtime/response';
import { HasManyRelationship, RelationshipDescriptor } from '../descriptors';
import * as Errors from 'http-errors';
import {
  isArray,
  assign,
  mapValues,
  forEach,
  isUndefined } from 'lodash';

/**
 * Renders the payload as a flat JSON object or array at the top level. Related
 * records are embedded.
 *
 * @export
 * @class FlatSerializer
 * @extends {Serializer}
 * @module denali
 * @submodule data
 */
export default class FlatSerializer extends Serializer {

  /**
   * @type {string}
   */
  public contentType: string = 'application/json';

  /**
   * Renders the payload, either a primary data payload or an error payload.
   *
   * @param {Response} response
   * @param {*} [options={}]
   */
  public async serialize(response: Response, options: any = {}): Promise<void> {
    if (response.body instanceof Error) {
      response.body = this.renderError(response.body);
    }
    response.body = this.renderPrimary(response.body, options);
    response.contentType = this.contentType;
  }

  /**
   * Renders a primary data payload (a record or array of records).
   *
   * @param {*} payload
   * @param {*} [options]
   * @returns {*}
   */
  public renderPrimary(payload: any, options?: any): any {
    if (isArray(payload)) {
      return payload.map((record) => {
        return this.renderRecord(record, options);
      });
    }
    return this.renderRecord(payload, options);
  }

  /**
   * Renders an individual record
   *
   * @protected
   * @param {any} record
   * @param {any} options
   * @returns
   */
  protected renderRecord(record: any, options?: any): any {
    let id = record.id;
    let attributes = this.serializeAttributes(record, options);
    let relationships = this.serializeRelationships(record, options);
    relationships = mapValues(relationships, (relationship) => {
      return relationship.data;
    });
    return assign({ id }, attributes, relationships);
  }

  /**
   * Serialize the attributes for a given record
   *
   * @protected
   * @param {*} record
   * @param {*} [options]
   * @returns {*}
   */
  protected serializeAttributes(record: any, options?: any): any {
    let serializedAttributes: any = {};
    this.attributes.forEach((attributeName) => {
      let key = this.serializeAttributeName(attributeName);
      let rawValue = record[attributeName];
      if (!isUndefined(rawValue)) {
        let value = this.serializeAttributeValue(rawValue, key, record);
        serializedAttributes[key] = value;
      }
    });
    return serializedAttributes;
  }

  /**
   * Transform attribute names into their over-the-wire representation. Default
   * behavior uses the attribute name as-is.
   *
   * @protected
   * @param {string} attributeName
   * @returns {string}
   */
  protected serializeAttributeName(attributeName: string): string {
    return attributeName;
  }

  /**
   * Take an attribute value and return the serialized value. Useful for
   * changing how certain types of values are serialized, i.e. Date objects.
   *
   * The default implementation returns the attribute's value unchanged.
   *
   * @protected
   * @param {*} value
   * @param {string} key
   * @param {*} record
   * @returns {*}
   */
  protected serializeAttributeValue(value: any, key: string, record: any): any {
    return value;
  }

  /**
   *
   *
   * @protected
   * @param {*} record
   * @param {*} [options={}]
   */
  protected serializeRelationships(record: any, options?: any) {
    let serializedRelationships: { [key: string ]: any } = {};

    // The result of this.relationships is a whitelist of which relationships
    // should be serialized, and the configuration for their serialization
    forEach(this.relationships, (config, relationshipName) => {
      let key = config.key || this.serializeRelationshipName(relationshipName);
      let descriptor = record.constructor[relationshipName];
      assert(descriptor, `You specified a '${ relationshipName }' relationship in your ${ record.constructor.type } serializer, but no such relationship is defined on the ${ record.constructor.type } model`);
      serializedRelationships[key] = this.serializeRelationship(config, descriptor, record, options);
    });
  }

  /**
   *
   *
   * @protected
   * @param {*} config
   * @param {Descriptor} descriptor
   * @param {*} record
   * @param {*} [options]
   * @returns
   */
  protected serializeRelationship(config: any, descriptor: RelationshipDescriptor, record: any, options?: any) {
    if (isArray(record)) {
      if (record[0] instanceof Model) {
        let relatedSerializer = this.container.lookup(`serializer:${ descriptor.type }`);
        return record.map((relatedRecord) => {
          return relatedSerializer.renderRecord(relatedRecord, options);
        });
      }
      return record;
    }
    if (record instanceof Model) {
      let relatedSerializer = this.container.lookup(`serializer:${ descriptor.type }`);
      return relatedSerializer.renderRecord(record, options);
    }
    return record;
  }

  /**
   * Transform relationship names into their over-the-wire representation. Default
   * behavior uses the relationship name as-is.
   *
   * @protected
   * @param {string} name
   * @returns {string}
   */
  protected serializeRelationshipName(name: string): string {
    return name;
  }

  /**
   * Render an error payload
   */
  protected renderError(error: any): any {
    return {
      status: error.status || 500,
      code: error.code || 'InternalServerError',
      message: error.message
    };
  }

}
