import * as RouteParser from 'route-parser';
import Action from './action';

export default class Route extends RouteParser {

  spec: string;
  additionalParams: any;
  action: Action;
  actionPath: string;

}
