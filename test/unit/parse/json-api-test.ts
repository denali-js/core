/* tslint:disable:completed-docs no-empty no-invalid-this member-access */
import ava, { RegisterContextual } from 'ava';
import { JSONAPIParser, MockRequest, Request } from 'denali';

const test = <RegisterContextual<{ parser: JSONAPIParser }>>ava;

function mockRequest(json?: any) {
  let mocked = new MockRequest({
    method: 'POST',
    headers: {
      'Content-type': 'application/vnd.api+json'
    },
    json
  });
  return new Request(mocked, <any>{});
}

// Fake the container initialization
test.beforeEach(async (t) => {
  let parser = t.context.parser = new JSONAPIParser(<any>{});
  parser.init();
});

test('returns responder params with primary request data flattened', async (t) => {
  let result = await t.context.parser.parse(mockRequest({
    data: {
      type: 'bar',
      attributes: {
        foo: true
      }
    }
  }));
  t.truthy(result.body);
  t.true(result.body.foo);
});

test('returns responder params with included records', async (t) => {
  let result = await t.context.parser.parse(mockRequest({
    data: {
      type: 'bar',
      attributes: {
        foo: true
      }
    },
    included: [
      {
        type: 'fizz',
        attributes: {
          buzz: true
        }
      }
    ]
  }));
  t.truthy(result.body);
  t.true(result.body.foo);
  t.truthy(result.included);
  t.true(result.included[0].buzz);
});

test("doesn't attempt to parse and returns no body if request body empty", async (t) => {
  let mocked = new MockRequest({
    method: 'GET'
  });
  let req = new Request(<any>mocked, <any>{});
  let result = await t.context.parser.parse(req);
  t.true(typeof result.body === 'undefined');
});
