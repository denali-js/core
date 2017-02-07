import * as assert from 'assert';
import * as path from 'path';
import { singularize, pluralize } from 'inflection';
import Serializer from '../serializer';
import Model from '../model';
import Errors from '../../runtime/errors';
import Response from '../../runtime/response';
import Router from '../../runtime/router';
import { RelationshipDescriptor } from '../descriptors';
import { RelationshipConfig } from '../serializer';
import { map, each, resolve } from 'bluebird';
import {
  assign,
  isArray,
  isUndefined,
  isEmpty,
  set,
  mapKeys,
  capitalize,
  camelCase,
  kebabCase,
  forEach,
  uniqBy
} from 'lodash';

function setIfNotEmpty(obj: any, key: string, value: any): void {
  if (!isEmpty(value)) {
    set(obj, key, value);
  }
}

interface JsonApiDocument {
  data?: JsonApiResourceObject | JsonApiResourceObject[] | JsonApiResourceIdentifier | JsonApiResourceIdentifier[];
  errors?: JsonApiError[];
  meta?: JsonApiMeta;
  jsonapi?: { version: string };
  links?: JsonApiLinks;
  included?: JsonApiResourceObject[];
}

/**
 * @interface JsonApiError
 */
interface JsonApiError {
  /**
   * A unique identifier for this particular occurrence of the problem
   *
   * @type {string}
    */
  id?: string;
  /**
   * @type {{ about?: JsonApiLink }}
   */
  links?: {
    /**
     * A link that leads to further details about this particular occurrence of the problemA
     *
     * @type {JsonApiLink}
     */
    about?: JsonApiLink;
  };
  /**
   * The HTTP status code applicable to this problem, expressed as a string value
   *
   * @type {string}
   */
  status?: string;
  /**
   * An application-specific error code, expressed as a string value
   *
   * @type {string}
   */
  code?: string;
  /**
   * A short, human-readable summary of the problem that SHOULD NOT change from occurrence to
   * occurrence of the problem, except for purposes of localization
   *
   * @type {string}
   */
  title?: string;
  /**
   * A human-readable explanation specific to this occurrence of the problem. Like title, this
   * field’s value can be localized
   *
   * @type {string}
   */
  detail?: string;
  /**
   * An object containing references to the source of the error
   *
   * @type {{
   *     pointer?: string;
   *     parameter?: string;
   *   }}
   */
  source?: {
    /**
     * A JSON Pointer [RFC6901] to the associated entity in the request document [e.g. "/data" for a
     * primary data object, or "/data/attributes/title" for a specific attribute]
     *
     * @type {string}
     */
    pointer?: string;
    /**
     * A string indicating which URI query parameter caused the error
     *
     * @type {string}
     */
    parameter?: string;
  };
  /**
   * @type {JsonApiMeta}
   */
  meta?: JsonApiMeta;
}

interface JsonApiResourceObject {
  id: string;
  type: string;
  attributes?: JsonApiAttributes;
  relationships?: JsonApiRelationships;
  links?: JsonApiLinks;
  meta?: JsonApiMeta;
}

interface JsonApiAttributes {
  [key: string]: any;
}

interface JsonApiRelationships {
  [relationshipName: string]: JsonApiRelationship
}

interface JsonApiRelationship {
  /**
   * Links for this relationship. Should contain at least a "self" or "related" link.
   *
   * @type {JsonApiLinks}
   */
  links?: JsonApiLinks;
  data?: JsonApiRelationshipData;
  meta?: JsonApiMeta;
}

type JsonApiRelationshipData = JsonApiResourceIdentifier | JsonApiResourceIdentifier[];

interface JsonApiResourceIdentifier {
  id: string;
  type: string;
  meta?: JsonApiMeta;
}

interface JsonApiMeta {
  [key: string]: any;
}

interface JsonApiLinks {
  /**
   * A link for the resource or relationship itself. This link allows the client to directly
   * manipulate the resource or relationship. For example, removing an author through an article’s
   * relationship URL would disconnect the person from the article without deleting the people
   * resource itself. When fetched successfully, this link returns the linkage for the related
   * resources as its primary data
   *
   * @type {JsonApiLink}
   */
  self?: JsonApiLink,
  /**
   * A “related resource link” provides access to resource objects linked in a relationship. When
   * fetched, the related resource object(s) are returned as the response’s primary data.
   *
   * @type {JsonApiLink}
   */
  related?: JsonApiLink
  [key: string]: JsonApiLink;
}

type JsonApiLink = string | {
  href: string,
  meta: JsonApiMeta
}

interface Options {
  /**
   * An array of Models you want to ensure are included in the "included" sideload. Note that the
   * spec requires "full-linkage" - i.e. any Models you include here must be referenced by a
   * resource identifier elsewhere in the payload - to maintain full compliance.
   *
   * @type {Model[]}
   */
  included?: Model[];
  /**
   * Any top level metadata to send with the response.
   *
   * @type {JsonApiMeta}
   */
  meta?: JsonApiMeta;
  /**
   * Any top level links to send with the response.
   *
   * @type {JsonApiLinks}
   */
  links?: JsonApiLinks;
  /**
   * Configuration for each relationship.
   *
   * @type {*}
   */
  relationships?: any;
  [key: string]: any;
}

/**
 * Used internally to simplify passing arguments required by all functions.
 *
 * @interface Context
 */
interface Context {
  response: Response;
  options: Options;
  document: JsonApiDocument;
}

/**
 * Renders the payload according to the JSONAPI 1.0 spec, including related resources, included
 * records, and support for meta and links.
 *
 * @export
 * @class JSONAPISerializer
 * @extends {Serializer}
 * @module denali
 * @submodule data
 */
export default class JSONAPISerializer extends Serializer {

  /**
   * The default content type to use for any responses rendered by this serializer.
   *
   * @type {string}
   */
  public contentType: string = 'application/vnd.api+json';

  /**
   * Take a response body (a model, an array of models, or an Error) and render it as a JSONAPI
   * compliant document
   *
   * @param {Response} response
   * @param {*} [options]
   */
  public async serialize(response: Response, options?: any): Promise<void> {
    let context: Context = {
      response,
      options,
      document: {}
    };
    await this.renderPrimary(context);
    await this.renderIncluded(context);
    this.renderMeta(context);
    this.renderLinks(context);
    this.renderVersion(context);
    this.dedupeIncluded(context);
    response.body = context.document;
    response.contentType = this.contentType;
  }

  /**
   * Render the primary payload for a JSONAPI document (either a model or array of models).
   *
   * @protected
   * @param {Context} context
   */
  protected async renderPrimary(context: Context): Promise<void> {
    let payload = context.response.body;
    if (isArray(payload)) {
      await this.renderPrimaryArray(context, payload);
    } else {
      await this.renderPrimaryObject(context, payload);
    }
  }

  /**
   * Render the primary data for the document, either a single Model or a single Error.
   *
   * @protected
   * @param {Context} context
   * @param {*} payload
   */
  protected async renderPrimaryObject(context: Context, payload: any): Promise<void> {
    if (payload instanceof Error) {
      context.document.errors = [ await this.renderError(context, payload) ];
    } else {
      context.document.data = await this.renderRecord(context, payload);
    }
  }

  /**
   * Render the primary data for the document, either an array of Models or Errors
   *
   * @protected
   * @param {Context} context
   * @param {*} payload
   */
  protected async renderPrimaryArray(context: Context, payload: any): Promise<void> {
    if (payload[0] instanceof Error) {
      context.document.errors = await map(payload, async (error: Error) => {
        assert(error instanceof Error, 'You passed a mixed array of errors and models to the JSON-API serializer. The JSON-API spec does not allow for both `data` and `errors` top level objects in a response');
        return await this.renderError(context, error);
      });
    } else {
      context.document.data = await map(payload, async (record: Model) => {
        assert(!(record instanceof Error), 'You passed a mixed array of errors and models to the JSON-API serializer. The JSON-API spec does not allow for both `data` and `errors` top level objects in a response');
        return await this.renderRecord(context, record);
      });
    }
  }

  /**
   * Render any included records supplied by the options into the top level of the document
   *
   * @protected
   * @param {Context} context
   */
  protected async renderIncluded(context: Context): Promise<void> {
    if (context.options.included) {
      assert(isArray(context.options.included), 'included records must be passed in as an array');
      context.document.included = await map(context.options.included, async (includedRecord) => {
        return await this.renderRecord(context, includedRecord);
      });
    }
  }

  /**
   * Render top level meta object for a document. Default uses meta supplied in options call to
   * res.render().
   *
   * @protected
   * @param {Context} context
   */
  protected renderMeta(context: Context): void {
    if (context.options.meta) {
      context.document.meta = context.options.meta;
    }
  }

  /**
   * Render top level links object for a document. Defaults to the links supplied in options.
   *
   * @protected
   * @param {Context} context
   */
  protected renderLinks(context: Context): void {
    if (context.options.links) {
      context.document.links = context.options.links;
    }
  }

  /**
   * Render the version of JSONAPI supported.
   *
   * @protected
   * @param {Context} context
   */
  protected renderVersion(context: Context): void {
    context.document.jsonapi = {
      version: '1.0'
    };
  }

  /**
   * Render the supplied record as a resource object.
   *
   * @protected
   * @param {Context} context
   * @param {Model} record
   * @returns {JsonApiResourceObject}
   */
  protected async renderRecord(context: Context, record: Model): Promise<JsonApiResourceObject> {
    assert(record, `Cannot serialize ${ record }. You supplied ${ record } instead of a Model instance.`);
    let serializedRecord: JsonApiResourceObject = {
      type: pluralize(record.type),
      id: record.id
    };
    assert(serializedRecord.id != null, `Attempted to serialize a record (${ record }) without an id, but the JSON-API spec requires all resources to have an id.`);
    setIfNotEmpty(serializedRecord, 'attributes', this.attributesForRecord(context, record));
    setIfNotEmpty(serializedRecord, 'relationships', await this.relationshipsForRecord(context, record));
    setIfNotEmpty(serializedRecord, 'links', this.linksForRecord(context, record));
    setIfNotEmpty(serializedRecord, 'meta', this.metaForRecord(context, record));
    return serializedRecord;
  }

  /**
   * Returns the JSONAPI attributes object representing this record's relationships
   *
   * @protected
   * @param {Context} context
   * @param {Model} record
   * @returns {JsonApiAttributes}
   */
  protected attributesForRecord(context: Context, record: Model): JsonApiAttributes {
    let serializedAttributes: JsonApiAttributes = {};
    this.attributes.forEach((attributeName) => {
      let key = this.serializeAttributeName(context, attributeName);
      let rawValue = record[attributeName];
      if (!isUndefined(rawValue)) {
        let value = this.serializeAttributeValue(context, rawValue, key, record);
        serializedAttributes[key] = value;
      }
    });
    return serializedAttributes;
  }

  /**
   * The JSONAPI spec recommends (but does not require) that property names be dasherized. The
   * default implementation of this serializer therefore does that, but you can override this method
   * to use a different approach.
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @returns {string}
   */
  protected serializeAttributeName(context: Context, name: string): string {
    return kebabCase(name);
  }

  /**
   * Take an attribute value and return the serialized value. Useful for changing how certain types
   * of values are serialized, i.e. Date objects.
   *
   * The default implementation returns the attribute's value unchanged.
   *
   * @protected
   * @param {Context} context
   * @param {*} value
   * @param {string} key
   * @param {Model} record
   * @returns {*}
   */
  protected serializeAttributeValue(context: Context, value: any, key: string, record: Model): any {
    return value;
  }

  /**
   * Returns the JSONAPI relationships object representing this record's relationships
   *
   * @protected
   * @param {Context} context
   * @param {Model} record
   * @returns {Promise<JsonApiRelationships>}
   */
  protected async relationshipsForRecord(context: Context, record: Model): Promise<JsonApiRelationships> {
    let serializedRelationships: JsonApiRelationships = {};

    // The result of this.relationships is a whitelist of which relationships should be serialized,
    // and the configuration for their serialization
    let relationshipNames = Object.keys(this.relationships);
    for (let i = 0; i < relationshipNames.length; i++) {
      let name = relationshipNames[i];
      let config = this.relationships[name];
      let key = config.key || this.serializeRelationshipName(context, name);
      let descriptor = (<any>record.constructor)[name];
      assert(descriptor, `You specified a '${ name }' relationship in your ${ record.type } serializer, but no such relationship is defined on the ${ record.type } model`);
      serializedRelationships[key] = await this.serializeRelationship(context, name, config, descriptor, record);
    }

    return serializedRelationships;
  }

  /**
   * Convert the relationship name to it's "over-the-wire" format. Defaults to dasherizing it.
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @returns {string}
   */
  protected serializeRelationshipName(context: Context, name: string): string {
    return kebabCase(name);
  }

  /**
   * Takes the serializer config and the model's descriptor for a relationship, and returns the
   * serialized relationship object. Also sideloads any full records if the relationship is so
   * configured.
   *
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @param {RelationshipConfig} config
   * @param {RelationshipDescriptor} descriptor
   * @param {Model} record
   * @returns {Promise<JsonApiRelationship>}
   */
  protected async serializeRelationship(context: Context, name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, record: Model): Promise<JsonApiRelationship> {
    let relationship: JsonApiRelationship = {};
    setIfNotEmpty(relationship, 'links', this.linksForRelationship(context, name, config, descriptor, record));
    setIfNotEmpty(relationship, 'meta', this.metaForRelationship(context, name, config, descriptor, record));
    setIfNotEmpty(relationship, 'data', await this.dataForRelationship(context, name, config, descriptor, record));
    return relationship;
  }

  /**
   * Returns the serialized form of the related Models for the given record and relationship.
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @param {RelationshipConfig} config
   * @param {RelationshipDescriptor} descriptor
   * @param {Model} record
   * @returns {Promise<JsonApiRelationshipData>}
   */
  protected async dataForRelationship(context: Context, name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, record: Model): Promise<JsonApiRelationshipData> {
    let relatedData = await record.getRelated(name);
    if (descriptor.mode === 'hasMany') {
      return await map(<Model[]>relatedData, async (relatedRecord) => {
        return await this.dataForRelatedRecord(context, name, relatedRecord, config, descriptor, record);
      });
    }
    return await this.dataForRelatedRecord(context, name, <Model>relatedData, config, descriptor, record);
  }

  /**
   * Given a related record, return the resource object for that record, and sideload the record as
   * well.
   *
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @param {Model} relatedRecord
   * @param {RelationshipConfig} config
   * @param {RelationshipDescriptor} descriptor
   * @param {Model} record
   * @returns {JsonApiResourceIdentifier}
   */
  protected async dataForRelatedRecord(context: Context, name: string, relatedRecord: Model, config: RelationshipConfig, descriptor: RelationshipDescriptor, record: Model): Promise<JsonApiResourceIdentifier> {
    await this.includeRecord(context, name, relatedRecord, config, descriptor);
    return {
      type: pluralize(relatedRecord.type),
      id: relatedRecord.id
    };
  }

  /**
   * Takes a relationship descriptor and the record it's for, and returns any links for that
   * relationship for that record. I.e. '/books/1/author'
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @param {RelationshipConfig} config
   * @param {RelationshipDescriptor} descriptor
   * @param {Model} record
   * @returns {JsonApiLinks}
   */
  protected linksForRelationship(context: Context, name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, record: Model): JsonApiLinks {
    let recordSelfLink = this.linksForRecord(context, record).self;
    let recordURL: string;
    if (typeof recordSelfLink === 'string') {
      recordURL = recordSelfLink;
    } else {
      recordURL = recordSelfLink.href;
    }
    return {
      self: path.join(recordURL, `relationships/${ name }`),
      related: path.join(recordURL, name)
    };
  }

  /**
   * Returns any meta for a given relationship and record. No meta included by default.
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @param {RelationshipConfig} config
   * @param {RelationshipDescriptor} descriptor
   * @param {Model} record
   * @returns {(JsonApiMeta | void)}
   */
  protected metaForRelationship(context: Context, name: string, config: RelationshipConfig, descriptor: RelationshipDescriptor, record: Model): JsonApiMeta | void {}

  /**
   * Returns links for a particular record, i.e. self: "/books/1". Default implementation assumes
   * the URL for a particular record maps to that type's `show` action, i.e. `books/show`.
   *
   * @protected
   * @param {Context} context
   * @param {Model} record
   * @returns {JsonApiLinks}
   */
  protected linksForRecord(context: Context, record: Model): JsonApiLinks {
    let router: Router = this.container.lookup('router:main');
    let url = router.urlFor(`${ pluralize(record.type) }/show`, record);
    return url ? { self: url } : null;
  }

  /**
   * Returns meta for a particular record.
   *
   * @protected
   * @param {Context} context
   * @param {Model} record
   * @returns {(void | JsonApiMeta)}
   */
  protected metaForRecord(context: Context, record: Model): void | JsonApiMeta {}

  /**
   * Sideloads a record into the top level "included" array
   *
   * @protected
   * @param {Context} context
   * @param {string} name
   * @param {Model} relatedRecord
   * @param {RelationshipConfig} config
   * @param {RelationshipDescriptor} descriptor
   */
  protected async includeRecord(context: Context, name: string, relatedRecord: Model, config: RelationshipConfig, descriptor: RelationshipDescriptor): Promise<void> {
    if (!isArray(context.document.included)) {
      context.document.included = [];
    }
    let relatedOptions = (context.options.relationships && context.options.relationships[name]) || context.options;
    let relatedSerializer: JSONAPISerializer = config.serializer || this.container.lookup(`serializer:${ relatedRecord.type }`);
    let relatedContext: Context = assign({}, context, { options: relatedOptions });
    context.document.included.push(await relatedSerializer.renderRecord(context, relatedRecord));
  }

  /**
   * Render the supplied error
   *
   * @protected
   * @param {Context} context
   * @param {*} error
   * @returns {JsonApiError}
   */
  protected renderError(context: Context, error: any): JsonApiError {
    let renderedError = {
      id: error.id,
      status: error.status || 500,
      code: error.code || error.name || 'InternalServerError',
      title: error.title,
      detail: error.message
    };
    setIfNotEmpty(renderedError, 'source', this.sourceForError(context, error));
    setIfNotEmpty(renderedError, 'meta', this.metaForError(context, error));
    setIfNotEmpty(renderedError, 'links', this.linksForError(context, error));
    return renderedError;
  }

  /**
   * Given an error, return a JSON Pointer, a URL query param name, or other info indicating the
   * source of the error.
   *
   * @protected
   * @param {Context} context
   * @param {*} error
   * @returns {string}
   */
  protected sourceForError(context: Context, error: any): string {
    return error.source;
  }

  /**
   * Return the meta for a given error object. You could use this for example, to return debug
   * information in development environments.
   *
   * @protected
   * @param {Context} context
   * @param {*} error
   * @returns {(JsonApiMeta | void)}
   */
  protected metaForError(context: Context, error: any): JsonApiMeta | void {
    return error.meta;
  }

  /**
   * Return a links object for an error. You could use this to link to a bug tracker report of the
   * error, for example.
   *
   * @protected
   * @param {Context} context
   * @param {*} error
   * @returns {(JsonApiLinks | void)}
   */
  protected linksForError(context: Context, error: any): JsonApiLinks | void {}

  /**
   * Remove duplicate entries from the sideloaded data.
   *
   * @protected
   * @param {Context} context
   */
  protected dedupeIncluded(context: Context): void {
    if (isArray(context.document.included)) {
      context.document.included = uniqBy(context.document.included, (resource) => {
        return `${ resource.type }/${ resource.id }`;
      });
    }
  }

  /**
   * Unlike the other serializers, the default parse implementation does modify the incoming
   * payload. It converts the default dasherized attribute names into camelCase.
   *
   * The parse method here retains the JSONAPI document structure (i.e. data, included, links, meta,
   * etc), only modifying resource objects in place.
   *
   * @param {*} payload
   * @param {*} [options]
   * @returns {*}
   */
  public parse(payload: any, options?: any): any {
    try {
      assert(payload.data, 'Invalid JSON-API document (missing top level `data` object - see http://jsonapi.org/format/#document-top-level)');
      let parseResource = this._parseResource.bind(this);
      if (payload.data) {
        if (!isArray(payload.data)) {
          payload.data = parseResource(payload.data);
        } else {
          payload.data = payload.data.map(parseResource);
        }
      }
      if (payload.included) {
        payload.included = payload.included.map(parseResource);
      }
    } catch (e) {
      if (e.name === 'AssertionError') {
        throw new Errors.BadRequest(e.message);
      }
      throw e;
    }
    return payload;
  }


  /**
   * Takes a JSON-API resource object and hands it off for parsing to the serializer specific to
   * that object's type.
   *
   * @private
   * @param {JsonApiResourceObject} resource
   * @returns {*}
   */
  private _parseResource(resource: JsonApiResourceObject): any {
    assert(typeof resource.type === 'string', 'Invalid resource object encountered (missing `type` - see http://jsonapi.org/format/#document-resource-object-identification)');
    resource.type = this.parseType(resource.type);
    let relatedSerializer: JSONAPISerializer = this.container.lookup(`serializer:${ resource.type }`);
    assert(relatedSerializer, `No serializer found for ${ resource.type }`);
    assert(relatedSerializer.parseResource, `The serializer found for ${ resource.type } does not implement the .parseResource() method. Are you trying to parse a model whose default serializer is not JSON-API?`);
    return relatedSerializer.parseResource(resource);
  }

  /**
   * Parse a single resource object from a JSONAPI document. The resource object could come from the
   * top level `data` payload, or from the sideloaded `included` records.
   *
   * @protected
   * @param {JsonApiResourceObject} resource
   * @returns {*}
   */
  protected parseResource(resource: JsonApiResourceObject): any {
    setIfNotEmpty(resource, 'id', this.parseId(resource.id));
    setIfNotEmpty(resource, 'attributes', this.parseAttributes(resource.attributes));
    setIfNotEmpty(resource, 'relationships', this.parseRelationships(resource.relationships));
    return resource;
  }

  /**
   * Parse a resource object id
   *
   * @protected
   * @param {string} id
   * @returns {*}
   */
  protected parseId(id: string): any {
    return id;
  }

  /**
   * Parse a resource object's type string
   *
   * @protected
   * @param {string} type
   * @returns {string}
   */
  protected parseType(type: string): string {
    return singularize(type);
  }

  /**
   * Parse a resource object's attributes. By default, this converts from the JSONAPI recommended
   * dasheried keys to camelCase.
   *
   * @protected
   * @param {JsonApiAttributes} attrs
   * @returns {*}
   */
  protected parseAttributes(attrs: JsonApiAttributes): any {
    return mapKeys(attrs, (value, key) => {
      return camelCase(key);
    });
  }

  /**
   * Parse a resource object's relationships. By default, this converts from the JSONAPI recommended
   * dasheried keys to camelCase.
   *
   * @protected
   * @param {JsonApiRelationships} relationships
   * @returns {*}
   */
  protected parseRelationships(relationships: JsonApiRelationships): any {
    return mapKeys(relationships, (value, key) => {
      return camelCase(key);
    });
  }

}
