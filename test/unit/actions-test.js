import expect from 'must';
import Action from '../../lib/runtime/action';
import merge from 'lodash/merge';

function mockReqRes(overrides) {
  return merge({
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
      render() {}
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

  it('should proxy this.render() to response.render()', function() {
    let rendered = false;
    class TestAction extends Action {
      respond() {
        this.render(true);
      }
    }
    let action = new TestAction(mockReqRes({
      response: {
        render() {
          rendered = true;
        }
      }
    }));

    return action.run().then(() => {
      expect(rendered).to.be.true();
    });
  });

  describe('filters', function() {

    it('should invoke before filters prior to respond()', function() {
      let sequence = [];
      class TestAction extends Action {
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
        before() {
          sequence.push('parent');
        }

        respond() {}
      }
      class ChildClass extends ParentClass {
        before() {
          sequence.push('child');
        }
      }
      let action = new ChildClass(mockReqRes());

      return action.run().then(() => {
        expect(sequence).to.eql([ 'parent', 'child' ]);
      });
    });

  });

  describe('content negotiation', function() {

    it('should respond with the content-type specific responder', function() {
      let responded = false;
      class TestAction extends Action {
        respond() {}
        respondWithHtml() {
          responded = true;
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
        expect(responded).to.be.true();
      });
    });

  });

  describe('when render is not called', function() {

    it('should autorender', function() {
      let rendered;
      class TestAction extends Action {
        respond() {
          return { foo: 'bar' };
        }
      }
      let action = new TestAction(mockReqRes({
        response: {
          render(result) {
            rendered = result;
          }
        }
      }));

      return action.run().then(() => {
        expect(rendered).to.eql({ foo: 'bar' });
      });
    });

  });

});
