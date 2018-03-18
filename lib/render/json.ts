import { isArray, assign, isUndefined } from 'lodash';
import * as assert from 'assert';
import { all } from 'bluebird';
import Serializer, { RelationshipConfig } from './serializer';
import Model from '../data/model';
import { RelationshipDescriptor } from '../data/descriptors';
import { lookup } from '../metal/container';
import { Dict } from '../utils/types';

/**
 * Renders the payload as a flat JSON object or array at the top level. Related
 * models are embedded.
 *
 * @package data
 * @since 0.1.0
 */
export default abstract class JSONSerializer extends Serializer {

  /**
   * The default content type to apply to responses formatted by this
   * serializer
   *
   * @since 0.1.0
   */
  contentType = 'application/json';

  /**
   * Renders the payload, either a primary data model(s) or an error payload.
   *
   * @since 0.1.0
   */
  async serialize(body: any): Promise<any> {
    if (body instanceof Error) {
      return this.renderError(body);
    }
    return this.renderPrimary(body);
  }

  /**
   * Renders a primary data payload (a model or array of models).
   *
   * @since 0.1.0
   */
  protected async renderPrimary(payload: any): Promise<any> {
    if (isArray(payload)) {
      return await all(payload.map(async (item) => {
        return await this.renderItem(item);
      }));
    }
    return await this.renderItem(payload);
  }

  /**
   * If the primary data isn't a model, just render whatever it is directly
   *
   * @since 0.1.0
   */
  async renderItem(item: any) {
    let adapter = this.findAdapterFor(item);
    if (adapter) {
      return await this.renderModel(adapter.wrap(item));
    }
    return item;
  }

  /**
   * Renders an individual model
   *
   * @since 0.1.0
   */
  async renderModel(model: Model): Promise<any> {
    let id = model.id;
    let attributes = this.serializeAttributes(model);
    let relationships = await this.serializeRelationships(model);
    return assign({ id }, attributes, relationships);
  }

  /**
   * Serialize the attributes for a given model
   *
   * @since 0.1.0
   */
  protected serializeAttributes(model: Model): any {
    let serializedAttributes: any = {};
    let attributes = this.attributesToSerialize();
    attributes.forEach((attributeName) => {
      let key = this.serializeAttributeName(attributeName);
      let rawValue = (<any>model)[attributeName];
      if (!isUndefined(rawValue)) {
        let value = this.serializeAttributeValue(rawValue, key, model);
        serializedAttributes[key] = value;
      }
    });
    return serializedAttributes;
  }

  /**
   * Transform attribute names into their over-the-wire representation. Default
   * behavior uses the attribute name as-is.
   *
   * @since 0.1.0
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
   * @since 0.1.0
   */
  protected serializeAttributeValue(value: any, key: string, model: any): any {
    return value;
  }

  /**
   * Serialize the relationships for a given model
   *
   * @since 0.1.0
   */
  protected async serializeRelationships(model: Model): Promise<Dict<any>> {
    let serializedRelationships: { [key: string ]: any } = {};
    let relationships = this.relationshipsToSerialize();

    // The result of this.relationships is a whitelist of which relationships
    // should be serialized, and the configuration for their serialization
    for (let relationshipName in this.relationships) {
      let config = relationships[relationshipName];
      let key = config.key || this.serializeRelationshipName(relationshipName);
      let descriptor = <RelationshipDescriptor>(<typeof Model>model.constructor).schema[relationshipName];
      assert(descriptor, `You specified a '${ relationshipName }' relationship in your ${ this.constructor.name } serializer, but no such relationship is defined on the ${ model.modelName } model`);
      serializedRelationships[key] = await this.serializeRelationship(relationshipName, config, descriptor, model);
    }

    return serializedRelationships;
  }

  /**
   * Serializes a relationship
   *
   * @since 0.1.0
   */
  protected async serializeRelationship(relationship: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, model: Model) {
    let relatedSerializer = lookup<JSONSerializer>(`serializer:${ descriptor.relatedModelName }`, { loose: true }) || lookup<JSONSerializer>(`serializer:application`, { loose: true });
    if (typeof relatedSerializer === 'boolean') {
      throw new Error(`No serializer found for ${ descriptor.relatedModelName }, and no fallback application serializer found either`);
    }
    if (descriptor.mode === 'hasMany') {
      let relatedModels = <Model[]>await model.getRelated(relationship);
      return await all(relatedModels.map(async (relatedModel: Model) => {
        if (config.strategy === 'embed') {
          return await (<JSONSerializer>relatedSerializer).renderModel(relatedModel);
        } else if (config.strategy === 'id') {
          return relatedModel.id;
        }
      }));
    } else {
      let relatedModel = <Model>await model.getRelated(relationship);
      if (config.strategy === 'embed') {
        return await relatedSerializer.renderModel(relatedModel);
      } else if (config.strategy === 'id') {
        return relatedModel.id;
      }
    }
  }

  /**
   * Transform relationship names into their over-the-wire representation.
   * Default behavior uses the relationship name as-is.
   *
   * @since 0.1.0
   */
  protected serializeRelationshipName(name: string): string {
    return name;
  }

  /**
   * Render an error payload
   *
   * @since 0.1.0
   */
  protected renderError(error: any): any {
    return {
      status: error.status || 500,
      code: error.code || 'InternalServerError',
      message: error.message
    };
  }

}
