import { assign, isArray, isUndefined, kebabCase, uniqBy, result } from 'lodash';
import * as assert from 'assert';
import * as path from 'path';
import { pluralize } from 'inflection';
import Serializer from './serializer';
import Model from '../data/model';
import Router from '../runtime/router';
import Action, { RenderOptions } from '../runtime/action';
import { RelationshipDescriptor } from '../data/descriptors';
import { lookup } from '../metal/container';
import { RelationshipConfig } from './serializer';
import { map } from 'bluebird';
import setIfNotEmpty from '../utils/set-if-not-empty';
import * as JSONAPI from '../utils/json-api';
import { Accessor } from '../utils/types';
import { inspect } from 'util';

export interface Options extends RenderOptions {
  /**
   * An array of Models you want to ensure are included in the "included" sideload. Note that the
   * spec requires "full-linkage" - i.e. any Models you include here must be referenced by a
   * resource identifier elsewhere in the payload - to maintain full compliance.
   */
  included?: Accessor<Model[]>;
  /**
   * Any top level metadata to send with the response.
   */
  meta?: Accessor<JSONAPI.Meta>;
  /**
   * Any top level links to send with the response.
   */
  links?: Accessor<JSONAPI.Links>;
  [key: string]: any;
}

/**
 * Renders the payload according to the JSONAPI 1.0 spec, including related
 * resources, included records, and support for meta and links.
 *
 * @package data
 * @since 0.1.0
 */
export default abstract class JSONAPISerializer extends Serializer {

  /**
   * The default content type to use for any responses rendered by this serializer.
   *
   * @since 0.1.0
   */
  contentType = 'application/vnd.api+json';

  protected options: RenderOptions;

  protected document: JSONAPI.Document = {};

  /**
   * Take a response body (a model, an array of models, or an Error) and render
   * it as a JSONAPI compliant document
   *
   * @since 0.1.0
   */
  async serialize(payload: any): Promise<JSONAPI.Document> {
    await this.renderPrimary(payload);
    await this.renderIncluded(payload);
    this.renderMeta(payload);
    this.renderLinks(payload);
    this.renderVersion(payload);
    return this.document;
  }

  /**
   * Render the primary payload for a JSONAPI document (either a model or array
   * of models).
   *
   * @since 0.1.0
   */
  protected async renderPrimary(payload: any): Promise<void> {
    if (isArray(payload)) {
      await this.renderPrimaryArray(payload);
    } else {
      await this.renderPrimaryObject(payload);
    }
  }

  /**
   * Render the primary data for the document, either a single Model or a
   * single Error.
   *
   * @since 0.1.0
   */
  protected async renderPrimaryObject(payload: any): Promise<void> {
    if (payload instanceof Error) {
      this.document.errors = [ await this.renderError(payload) ];
    } else {
      this.document.data = await this.renderRecord(payload);
    }
  }

  /**
   * Render the primary data for the document, either an array of Models or
   * Errors
   *
   * @since 0.1.0
   */
  protected async renderPrimaryArray(payload: any): Promise<void> {
    if (payload[0] instanceof Error) {
      this.document.errors = await map(payload, async (error: Error) => {
        assert(error instanceof Error, 'You passed a mixed array of errors and models to the JSON-API serializer. The JSON-API spec does not allow for both `data` and `errors` top level objects in a response');
        return await this.renderError(error);
      });
    } else {
      this.document.data = await map(payload, async (record: {}) => {
        assert(!(record instanceof Error), 'You passed a mixed array of errors and models to the JSON-API serializer. The JSON-API spec does not allow for both `data` and `errors` top level objects in a response');
        return await this.renderRecord(record);
      });
    }
  }

  /**
   * Render any included records supplied by the options into the top level of
   * the document
   *
   * @since 0.1.0
   */
  protected async renderIncluded(payload: any): Promise<void> {
    if (this.options.included) {
      assert(isArray(this.options.included), 'included records must be passed in as an array');
      this.document.included = [];
      let alreadyIncluded = new Set<string>();
      for (let includedRecord of result<Model[]>(this, 'options.included')) {
        let hash = includedRecord.hash();
        if (alreadyIncluded.has(hash)) {
          continue;
        }
        alreadyIncluded.add(hash);
        this.document.included.push(await this.renderRecord(includedRecord));
      }
    }
  }

  /**
   * Render top level meta object for a document. Default uses meta supplied in
   * options call to res.render().
   *
   * @since 0.1.0
   */
  protected renderMeta(payload: any): void {
    if (this.options.meta) {
      this.document.meta = result(this, 'options.meta');
    }
  }

  /**
   * Render top level links object for a document. Defaults to the links
   * supplied in options.
   *
   * @since 0.1.0
   */
  protected renderLinks(payload: any): void {
    if (this.options.links) {
      this.document.links = result(this, 'options.links');
    }
  }

  /**
   * Render the version of JSONAPI supported.
   *
   * @since 0.1.0
   */
  protected renderVersion(payload: any): void {
    this.document.jsonapi = {
      version: '1.0'
    };
  }

  /**
   * Render the supplied record as a resource object.
   *
   * @since 0.1.0
   */
  protected async renderRecord(record: {}): Promise<JSONAPI.ResourceObject> {
    let adapter = this.findAdapterFor(record);
    assert(adapter, `Unable to find an ORM adapter for ${ inspect(record) }`);
    let model = adapter.wrap(record);
    let serializedRecord: JSONAPI.ResourceObject = {
      type: pluralize(model.modelName),
      id: model.id
    };
    assert(serializedRecord.id != null, `Attempted to serialize a record (${ model }) without an id, but the JSON-API spec requires all resources to have an id.`);
    setIfNotEmpty(serializedRecord, 'attributes', this.attributesForRecord(model));
    setIfNotEmpty(serializedRecord, 'relationships', await this.relationshipsForRecord(model));
    setIfNotEmpty(serializedRecord, 'links', this.linksForRecord(model));
    setIfNotEmpty(serializedRecord, 'meta', this.metaForRecord(model));
    return serializedRecord;
  }

  /**
   * Returns the JSONAPI attributes object representing this record's
   * relationships
   *
   * @since 0.1.0
   */
  protected attributesForRecord(model: Model): JSONAPI.Attributes {
    let serializedAttributes: JSONAPI.Attributes = {};
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
   * The JSONAPI spec recommends (but does not require) that property names be
   * dasherized. The default implementation of this serializer therefore does
   * that, but you can override this method to use a different approach.
   *
   * @since 0.1.0
   */
  protected serializeAttributeName(name: string): string {
    return kebabCase(name);
  }

  /**
   * Take an attribute value and return the serialized value. Useful for
   * changing how certain types of values are serialized, i.e. Date objects.
   *
   * The default implementation returns the attribute's value unchanged.
   *
   * @since 0.1.0
   */
  protected serializeAttributeValue(value: any, key: string, model: Model): any {
    return value;
  }

  /**
   * Returns the JSONAPI relationships object representing this record's
   * relationships
   *
   * @since 0.1.0
   */
  protected async relationshipsForRecord(model: Model): Promise<JSONAPI.Relationships> {
    let serializedRelationships: JSONAPI.Relationships = {};
    let relationships = this.relationshipsToSerialize();

    // The result of this.relationships is a whitelist of which relationships should be serialized,
    // and the configuration for their serialization
    let relationshipNames = Object.keys(relationships);
    for (let name of relationshipNames) {
      let config = relationships[name];
      let key = config.key || this.serializeRelationshipName(name);
      let descriptor = <RelationshipDescriptor>(<typeof Model>model.constructor).schema[name];
      assert(descriptor, `You specified a '${ name }' relationship in your ${ model.modelName } serializer, but no such relationship is defined on the ${ model.modelName } model`);
      serializedRelationships[key] = await this.serializeRelationship(name, config, descriptor, model);
    }

    return serializedRelationships;
  }

  /**
   * Convert the relationship name to it's "over-the-wire" format. Defaults to
   * dasherizing it.
   *
   * @since 0.1.0
   */
  protected serializeRelationshipName(name: string): string {
    return kebabCase(name);
  }

  /**
   * Takes the serializer config and the model's descriptor for a relationship,
   * and returns the serialized relationship object. Also sideloads any full
   * records if the relationship is so configured.
   *
   * @since 0.1.0
   */
  protected async serializeRelationship(name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, model: Model): Promise<JSONAPI.Relationship> {
    let relationship: JSONAPI.Relationship = {};
    setIfNotEmpty(relationship, 'links', this.linksForRelationship(name, config, descriptor, model));
    setIfNotEmpty(relationship, 'meta', this.metaForRelationship(name, config, descriptor, model));
    setIfNotEmpty(relationship, 'data', await this.dataForRelationship(name, config, descriptor, model));
    return relationship;
  }

  /**
   * Returns the serialized form of the related Models for the given record and
   * relationship.
   *
   * @since 0.1.0
   */
  protected async dataForRelationship(name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, model: Model): Promise<JSONAPI.RelationshipData> {
    let relatedData = await model.getRelated(name);
    if (descriptor.mode === 'hasMany') {
      return await map(<Model[]>relatedData, async (relatedRecord) => {
        return await this.dataForRelatedRecord(name, relatedRecord, config, descriptor, model);
      });
    }
    return await this.dataForRelatedRecord(name, <Model>relatedData, config, descriptor, model);
  }

  /**
   * Given a related record, return the resource object for that record, and
   * sideload the record as well.
   *
   * @since 0.1.0
   */
  protected async dataForRelatedRecord(name: string, relatedRecord: Model, config: RelationshipConfig, descriptor: RelationshipDescriptor, model: Model): Promise<JSONAPI.ResourceIdentifier> {
    if (config.strategy === 'embed') {
      await this.includeRecord(name, relatedRecord, config, descriptor);
    }
    return {
      type: pluralize(relatedRecord.modelName),
      id: relatedRecord.id
    };
  }

  /**
   * Takes a relationship descriptor and the record it's for, and returns any
   * links for that relationship for that record. I.e. '/books/1/author'
   *
   * @since 0.1.0
   */
  protected linksForRelationship(name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, model: Model): JSONAPI.Links {
    let recordLinks = this.linksForRecord(model);
    let recordURL: string;
    if (recordLinks) {
      if (typeof recordLinks.self === 'string') {
        recordURL = recordLinks.self;
      } else {
        recordURL = recordLinks.self.href;
      }
      return {
        self: path.join(recordURL, `relationships/${ name }`),
        related: path.join(recordURL, name)
      };
    }
    return null;
  }

  /**
   * Returns any meta for a given relationship and record. No meta included by
   * default.
   *
   * @since 0.1.0
   */
  protected metaForRelationship(name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, model: Model): JSONAPI.Meta | void {
    // defaults to no meta content
  }

  /**
   * Returns links for a particular record, i.e. self: "/books/1". Default
   * implementation assumes the URL for a particular record maps to that type's
   * `show` action, i.e. `books/show`.
   *
   * @since 0.1.0
   */
  protected linksForRecord(model: Model): JSONAPI.Links {
    let router = lookup<Router>('app:router');
    let url = router.urlFor(`${ pluralize(model.modelName) }/show`, model);
    return typeof url === 'string' ? { self: url } : null;
  }

  /**
   * Returns meta for a particular record.
   *
   * @since 0.1.0
   */
  protected metaForRecord(model: Model): void | JSONAPI.Meta {
    // defaults to no meta
  }

  /**
   * Sideloads a record into the top level "included" array
   *
   * @since 0.1.0
   */
  protected async includeRecord(name: string, relatedRecord: Model, config: RelationshipConfig, descriptor: RelationshipDescriptor): Promise<void> {
    assert(relatedRecord, 'You tried to sideload an included record, but the record itself was not provided.');
    if (!isArray(this.document.included)) {
      this.document.included = [];
    }
    let relatedOptions = result(this, [ 'options', 'relationships', name ], this.options);
    let relatedSerializer = lookup<JSONAPISerializer>(`serializer:${ config.serializer || relatedRecord.modelName }`);
    // LEFT OFF
    // transitioning serializers to non-singletons. small roadbump: right here, we'll have to instantiate a serializer for every related type?
    this.document.included.push(await relatedSerializer.renderRecord(relatedRecord));
  }

  /**
   * Render the supplied error
   *
   * @since 0.1.0
   */
  protected renderError(context: Context, error: any): JSONAPI.ErrorObject {
    let renderedError: JSONAPI.ErrorObject = {
      status: String(error.status) || '500',
      code: error.code || error.name || 'InternalServerError',
      detail: error.message
    };
    setIfNotEmpty(renderedError, 'id', this.idForError(context, error));
    setIfNotEmpty(renderedError, 'title', this.titleForError(context, error));
    setIfNotEmpty(renderedError, 'source', this.sourceForError(context, error));
    setIfNotEmpty(renderedError, 'meta', this.metaForError(context, error));
    setIfNotEmpty(renderedError, 'links', this.linksForError(context, error));
    return renderedError;
  }

  /**
   * Given an error, return a unique id for this particular occurence of the
   * problem.
   *
   * @since 0.1.0
   */
  protected idForError(context: Context, error: any): string {
    return error.id;
  }

  /**
   * A short, human-readable summary of the problem that SHOULD NOT change from
   * occurrence to occurrence of the problem, except for purposes of
   * localization.
   *
   * @since 0.1.0
   */
  protected titleForError(context: Context, error: any): string {
    return error.title;
  }

  /**
   * Given an error, return a JSON Pointer, a URL query param name, or other
   * info indicating the source of the error.
   *
   * @since 0.1.0
   */
  protected sourceForError(context: Context, error: any): string {
    return error.source;
  }

  /**
   * Return the meta for a given error object. You could use this for example,
   * to return debug information in development environments.
   *
   * @since 0.1.0
   */
  protected metaForError(context: Context, error: any): JSONAPI.Meta | void {
    return error.meta;
  }

  /**
   * Return a links object for an error. You could use this to link to a bug
   * tracker report of the error, for example.
   *
   * @since 0.1.0
   */
  protected linksForError(context: Context, error: any): JSONAPI.Links | void {
    // defaults to no links
  }

  /**
   * Remove duplicate entries from the sideloaded data.
   *
   * @since 0.1.0
   */
  // protected dedupeIncluded(context: Context): void {
  //   if (isArray(context.document.included)) {
  //     context.document.included = uniqBy(context.document.included, (resource) => {
  //       return `${ resource.type }/${ resource.id }`;
  //     });
  //   }
  // }

}
