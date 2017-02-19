/* tslint:disable:completed-docs no-empty no-invalid-this member-access */
import test from 'ava';
import {
  Action,
  Model,
  Container,
  Serializer,
  Service,
  FlatSerializer } from 'denali';
import {
  merge
} from 'lodash';
import Response from '../../lib/runtime/response';

function mockReqRes(overrides?: any): any {
  let container = new Container();

  container.register('serializer:application', FlatSerializer);
  container.register('config:environment', {});

  return merge({
    container,
    request: {
      get(headerName: string) {
        return this.headers && this.headers[headerName.toLowerCase()];
      },
      headers: {
        'content-type': 'application/json'
      },
      query: {},
      body: {}
    },
    response: {
      write() {},
      setHeader() {},
      render() {},
      end() {}
    },
    next() {}
  }, overrides);
}

test('Action > invokes respond() with params', async (t) => {
  t.plan(3);
  class TestAction extends Action {
    async respond(params: any) {
      t.true(params.query);
      t.true(params.body);
      t.pass();
    }
  }
  let action = new TestAction(mockReqRes({
    request: {
      query: { query: true },
      body: { body: true }
    }
  }));
  return action.run();
});

test('Action > does not invoke the serializer if no response body was provided', async (t) => {
  t.plan(1);
  class TestAction extends Action {
    serializer = 'foo';
    respond() {
      t.pass();
    }
  }
  let mock = mockReqRes();
  mock.container.register('serializer:foo', class extends Serializer {
    serialize(response: Response) {
      t.fail('Serializer should not be invoked');
    }
  });
  let action = new TestAction(mock);

  return action.run();
});

test('Action > uses a specified serializer type when provided', async (t) => {
  t.plan(2);
  class TestAction extends Action {
    serializer = 'foo';
    respond() {
      t.pass();
      return {};
    }
  }
  let mock = mockReqRes();
  mock.container.register('serializer:foo', class extends Serializer {
    serialize() {
      t.pass();
    }
  });
  let action = new TestAction(mock);

  return action.run();
});

test('Action > renders with the error serializer if an error was rendered', async (t) => {
  t.plan(2);
  class TestAction extends Action {
    respond() {
      t.pass();
      return new Error();
    }
  }
  let mock = mockReqRes();
  mock.container.register('serializer:error', class extends Serializer {
    serialize() {
      t.pass();
    }
  });
  let action = new TestAction(mock);

  return action.run();
});

test('Action > should render with the model type serializer if a model was rendered', async (t) => {
  t.plan(2);
  let mock = mockReqRes();
  class TestAction extends Action {
    respond() {
      t.pass();
      return new Proxy({
        constructor: { type: 'foo' },
        type: 'foo'
      }, {
        getPrototypeOf() {
          return Model.prototype;
        }
      });
    }
  }
  mock.container.register('serializer:foo', class extends Serializer {
    serialize() {
      t.pass();
    }
  });
  let action = new TestAction(mock);

  return action.run();
});

test('Action > should render with the application serializer if all options exhausted', async (t) => {
  t.plan(2);
  let mock = mockReqRes();
  class TestAction extends Action {
    respond() {
      t.pass();
      return {};
    }
  }
  mock.container.register('serializer:application', class extends Serializer {
    serialize() {
      t.pass();
    }
  });
  let action = new TestAction(mock);

  return action.run();
});

test('Action > filters > invokes before filters prior to respond()', async (t) => {
  let sequence: string[] = [];
  class TestAction extends Action {
    static before = [ 'before' ];
    static after = [ 'after' ];

    before() {
      sequence.push('before');
    }

    respond() {
      sequence.push('respond');
    }

    after() {
      sequence.push('after');
    }
  }
  let action = new TestAction(mockReqRes());

  await action.run();
  t.deepEqual(sequence, [ 'before', 'respond', 'after' ]);
});

test('Action > filters > invokes superclass filters before subclass filters', async (t) => {
  let sequence: string[] = [];
  class ParentClass extends Action {
    static before = [ 'before' ];

    before() {
      sequence.push('parent');
    }

    respond() {}
  }
  class ChildClass extends ParentClass {
    static before = [ 'before', 'beforeChild' ];

    beforeChild() {
      sequence.push('child');
    }
  }
  let action = new ChildClass(mockReqRes());

  await action.run();
  t.deepEqual(sequence, [ 'parent', 'child' ]);
});

test('Action > filters > error out when an non-existent filter was specified', async (t) => {
  class TestAction extends Action {
    static before = [ 'some-non-existent-method' ];
    respond() {}
  }
  let action = new TestAction(mockReqRes());

  // tslint:disable-next-line:no-floating-promises
  t.throws(action.run());
});

test('Action > filters > should render the returned value of a before filter (if that value != null)', async (t) => {
  t.plan(1);
  class TestAction extends Action {
    static before = [ 'preempt' ];
    serializer = false;
    respond() {
      t.fail('Filter should have preempted this responder method');
    }
    preempt() {
      return { hello: 'world' };
    }
  }
  let action = new TestAction(mockReqRes());
  let response = await action.run();
  t.deepEqual(response.body, { hello: 'world' });
});

test('Action > content negotiation > respond with the content-type specific responder', async (t) => {
  class TestAction extends Action {
    respond() {
      t.fail('Should have used HTML responder');
    }
    respondWithHtml() {
      t.pass();
    }
}
  let action = new TestAction(mockReqRes({
    request: {
      headers: {
        'Content-type': 'text/html'
      },
      accepts() {
        return 'html';
      }
    }
  }));

  return action.run();
});

test('Action > #modelFor(type) > returns the model for a given type', async (t) => {
  let mock = mockReqRes();
  class User extends Model {}
  mock.container.register('model:user', User);
  class TestAction extends Action {
    respond() {}
  }
  let action = new TestAction(mock);

  let ContainerUser = action.modelFor('user');
  t.is(ContainerUser.type, 'user');
});

test('Action > #service(name) > returns the service for a given service name', async (t) => {
  let mock = mockReqRes();
  class MyService extends Service {}
  mock.container.register('service:mine', MyService);
  class TestAction extends Action {
    respond() {}
  }
  let action = new TestAction(mock);

  let service = action.service('mine');
  t.true(service instanceof MyService);
});
