import expect from 'must';
import Action from '../../lib/runtime/action';
import Response from '../../lib/runtime/response';
import Container from '../../lib/runtime/container';
import FlatSerializer from '../../lib/runtime/base/app/serializers/flat';
import merge from 'lodash/merge';

function mockReqRes(overrides) {
  let container = new Container();

  container.register('serializer:application', FlatSerializer);
  container.register('config:environment', {});

  return merge({
    container,
    request: {
      get(headerName) {
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

describe('Denali.Action', function() {
  it('should invoke respond() with params', function() {
    let responded = false;
    class TestAction extends Action {
      respond(params) {
        expect(params.query).to.be.true();
        expect(params.body).to.be.true();
        responded = true;
      }
    }
    let action = new TestAction(mockReqRes({
      request: {
        query: { query: true },
        body: { body: true }
      }
    }));

    return action.run().then(() => {
      expect(responded).to.be.true();
    });
  });

  describe('filters', function() {

    it('should invoke before filters prior to respond()', function() {
      let sequence = [];
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

      return action.run().then(() => {
        expect(sequence).to.eql([ 'before', 'respond', 'after' ]);
      });
    });

    it('should invoke superclass filters before subclass filters', function() {
      let sequence = [];
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

      return action.run().then(() => {
        expect(sequence).to.eql([ 'parent', 'child' ]);
      });
    });

    it('should error out when an non-existent filter was specified', function() {
      class TestAction extends Action {
        static before = [ 'some-non-existent-method' ];
        respond() {}
      }
      let action = new TestAction(mockReqRes());

      return action.run.bind(action).must.throw();
    });

  });

  describe('content negotiation', function() {

    it('should respond with the content-type specific responder', function() {
      let responded = false;
      let respondedWithHtml = false;
      class TestAction extends Action {
        respond() {
          responded = true;
        }
        respondWithHtml() {
          respondedWithHtml = true;
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

      return action.run().then(() => {
        expect(responded).to.be.false();
        expect(respondedWithHtml).to.be.true();
      });
    });

  });

  describe('when render is not called', function() {

    it('should autorender', function() {
      let rendered;
      class TestAction extends Action {
        respond() {
          return new Response(200, { foo: 'bar' }, { raw: true });
        }
      }
      let action = new TestAction(mockReqRes({
        response: {
          write(result) {
            rendered = JSON.parse(result);
          }
        }
      }));

      return action.run().then(() => {
        expect(rendered).to.eql({ foo: 'bar' });
      });
    });

  });

  describe('wrapper methods', function() {

    it('should return model when using modelFor', function() {
      let model;
      class TestAction extends Action {
        respond() {
          let User = this.modelFor('user');
          model = User;
          return User;
        }
      }
      let mock = mockReqRes();

      mock.container.register('model:user', { type: 'user' });

      let action = new TestAction(mock);

      return action.run().then(() => {
        expect(model.type).to.eql('user');
        expect(model.container).to.eql(action.container);
      });
    });

    it('should return service when using service(type)', function() {
      let service;
      class TestAction extends Action {
        respond() {
          let Mine = this.service('mine');
          service = Mine;
          return Mine;
        }
      }
      let mock = mockReqRes();

      mock.container.register('service:mine', { type: 'mine' });

      let action = new TestAction(mock);

      return action.run().then(() => {
        expect(service.type).to.eql('mine');
      });
    });

  });

});
