import View from './view';
import { RenderOptions } from '../runtime/action';
import Errors from '../runtime/errors';
import result from '../utils/result';
import container, { lookup } from '../metal/container';
import ORMAdapter from '../data/orm-adapter';

export interface RelationshipConfig {
  strategy?: 'embed' | 'id' | string;
  key?: string;
  serializer?: string;
}

export interface RelationshipConfigs {
  [relationshipName: string]: RelationshipConfig;
}

/**
 * Serializers allow you to customize what data is returned in the response and
 * apply simple transformations to it. They allow you to decouple what data is
 * sent from how that data is structured / rendered.
 *
 * @package data
 * @since 0.1.0
 */
export default abstract class Serializer extends View {

  /**
   * Use as the value for any Serializer's `attributes` static property to ensure
   * all attributes are included. This is effectively an opt-in to bypass the the
   * default whitelisting behavior of Denali's Serializers.
   */
  static ALL_ATTRIBUTES = Symbol('all attributes');

  /**
   * Use as a key in any Serializer's `relationships` static property to ensure
   * all relationships are serialized with the options found under this key. This
   * is effectively an opt-in to bypass the the default whitelisting behavior of
   * Denali's Serializers.
   *
   * Note: if other relationship configs are found as well, those will override
   * any settings found under the ALL_RELATIONSHIPS key.
   */
  static ALL_RELATIONSHIPS = Symbol('all relationships');

  /**
   * The content type header to send back with the response
   *
   * @since 0.1.0
   */
  protected contentType = 'application/json';

  /**
   * The list of attribute names that should be serialized. Attributes not
   * included in this list will be omitted from the final rendered payload.
   *
   * @since 0.1.0
   */
  protected abstract attributes: ((...args: any[]) => string[]) | string[];

  /**
   * An object with configuration on how to serialize relationships.
   * Relationships that have no configuration present are omitted from the
   * final rendered payload.
   *
   * Out of the box, one option is supported:
   *
   * **strategy**
   *
   * It has one of two possible values:
   *
   *   * `embed`: embed all related records in the response payload
   *   * `id`: include only the id of the related record(s)
   *
   * What the embedded records or ids look like is up to each serializer to
   * determine.
   *
   * @since 0.1.0
   */
  protected abstract relationships: ((...args: any[]) => RelationshipConfigs) | RelationshipConfigs;

  protected options: RenderOptions;

  /**
   * Convenience method to encapsulate standard attribute whitelist behavior -
   * render options take precedence, then allow this.attributes to be a
   * function or straight definition
   *
   * @since 0.1.0
   */
  protected attributesToSerialize() {
    return result(this.attributes);
  }

  /**
   * Convenience method to encapsulate standard relationship whitelist behavior
   * - render options take precedence, then allow this.relationships to be a
   * function or straight definition
   *
   * @since 0.1.0
   */
  protected relationshipsToSerialize() {
    return result(this.relationships);
  }

  async render(body: any, options: RenderOptions): Promise<void> {
    this.options = options;
    this.response.setHeader('Content-type', this.contentType);
    if (body instanceof Errors) {
      this.response.statusCode = body.status;
    }
    let serialized = await this.serialize(body);
    let isProduction = lookup('config:environment').environment === 'production';
    this.response.write(JSON.stringify(serialized , null, isProduction ? 0 : 2) || '');
    this.response.end();
  }

  protected abstract async serialize(body: any): Promise<any>;

  protected findAdapterFor(model: {}): ORMAdapter | null {
    let adapters = container.lookupAll<ORMAdapter>('orm-adapter');
    for (let adapterName in adapters) {
      let adapter = adapters[adapterName];
      if (adapter.isModelInstance(model)) {
        return adapter;
      }
    }
    return null;
  }

}
