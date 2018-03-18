import { ServerResponse } from 'http';
import { RenderOptions } from '../runtime/action';
import { Dict } from '../utils/types';

export default abstract class View {

  constructor(protected request: Request, protected response: ServerResponse, protected context: Dict<any>) {}

  abstract async render(body: any, options: RenderOptions): Promise<void>;

}
