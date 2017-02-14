import * as RouteParser from 'route-parser';
import Action from './action';

/**
 * Extends the base RouteParser Route class with some additional properties that Denali tacks on.
 *
 * @module denali
 * @submodule runtime
 */
export default class Route extends RouteParser {

  /**
   * The spec for this route (just exposing this property in the type definition, since the
   * RouteParser type definitions incorrectly don't include this property).
   */
  public spec: string;

  /**
   * You can define static data that should be included in the `params` passed to an action when
   * you define a route in the config/routes.js file. This is useful if you have a single action
   * class whose behavior should vary based on the endpoint hitting it (i.e. an authentication
   * action whose logic is identical, but needs to lookup different models based on the url)
   */
  public additionalParams: any;

  /**
   * The Action class that should be invoked when a request hits this route
   */
  public action: Action;

  /**
   * The container name of the action
   */
  public actionPath: string;

}
