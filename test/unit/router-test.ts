/* tslint:disable:completed-docs no-empty no-invalid-this member-access */
import test from 'ava';
import { IncomingMessage } from 'http';
import {
  Logger,
  Router,
  MockRequest,
  MockResponse,
  Container,
  Serializer,
  Action } from 'denali';

test('Router > runs middleware before determining routing', async (t) => {
  t.plan(2);
  let count = 0;
  let container = new Container();
  let logger = new Logger();
  container.register('config:environment', { environment: 'development' });
  container.register('action:error', class TestAction extends Action {
    respond() {
      count += 1;
      t.is(count, 2);
    }
  });
  let router = new Router({ container, logger });
  router.use((req, res, next) => {
    count += 1;
    t.is(count, 1);
    next();
  });
  await router.handle(<any>(new MockRequest()), (<any>new MockResponse()));
});

test('Router > does not attempt to serialize when action.serializer = false', async (t) => {
  t.plan(1);
  let container = new Container();
  let logger = new Logger();
  container.register('config:environment', { environment: 'development' });
  container.register('action:error', class TestAction extends Action {
    serializer: false = false;
    respond(params: any) {
      t.fail(` Router should not have encountered an error:\n${ params.error.stack }`);
    }
  });
  container.register('action:index', class TestAction extends Action {
    serializer: false = false;
    respond() {
      t.pass();
    }
  });
  container.register('serializer:application', class extends Serializer {
    parse() {
      t.fail('Router should not have attempted to parse this request with a serializer');
    }
    serialize() {
      t.fail('Router should not have attempted to serialize this response with a serializer');
    }
  });
  let router = new Router({ container, logger });
  router.post('/', 'index');

  let req = new MockRequest({ url: '/', method: 'POST' });
  req.write('{}');
  await router.handle(<any>req, <any>new MockResponse());
});
