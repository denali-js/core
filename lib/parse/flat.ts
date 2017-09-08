import JSONParser from './json';
import Request from '../runtime/request';
import { ResponderParams } from '../runtime/action';

export default class FlatParser extends JSONParser {

  async parse(request: Request) {
    await this.bufferAndParseBody(request);

    return <ResponderParams>{
      body: request.body,
      query: request.query,
      headers: request.headers,
      params: request.params
    };
  }

}
