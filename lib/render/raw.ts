import Serializer from './serializer';
import Action, { RenderOptions } from '../runtime/action';

/**
 * Renders the payload as a flat JSON object or array at the top level. Related
 * models are embedded.
 *
 * @package data
 */
export default abstract class RawSerializer extends Serializer {

  /**
   * The default content type to apply to responses formatted by this serializer
   */
  contentType = 'application/json';

  /**
   * Renders the payload, either a primary data model(s) or an error payload.
   */
  async serialize(body: any, action: Action, options: RenderOptions = {}): Promise<any> {
    return body;
  }

}
