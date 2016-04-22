let expect = require('must');
let Action = require('../../lib/runtime/action');
let merge = require('lodash/object/merge');

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
    let TestAction = Action.extend({
      respond(params) {
        expect(params.query).to.be.true();
        expect(params.body).to.be.true();
        responded = true;
      }
    });
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
    let TestAction = Action.extend({
      respond() {
        this.render(true);
      }
    });
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
      let TestAction = Action.extend({
        before() {
          sequence.push('before');
        },
        respond() {
          sequence.push('respond');
        },
        after() {
          sequence.push('after');
        }
      });
      let action = new TestAction(mockReqRes());

      return action.run().then(() => {
        expect(sequence).to.eql([ 'before', 'respond', 'after' ]);
      });
    });

    it('should invoke superclass filters before subclass filters', function() {
      let sequence = [];
      let ParentClass = Action.extend({
        before() {
          sequence.push('parent');
        },
        respond() {}
      });
      let ChildClass = ParentClass.extend({
        before() {
          sequence.push('child');
        }
      });
      let action = new ChildClass(mockReqRes());

      return action.run().then(() => {
        expect(sequence).to.eql([ 'parent', 'child' ]);
      });
    });

  });

  describe('content negotiation', function() {

    it('should respond with the content-type specific responder', function() {
      let responded = false;
      let TestAction = Action.extend({
        respond() {},
        respondWithHtml() {
          responded = true;
        }
      });
      let action = TestAction.create(mockReqRes({
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
      let TestAction = Action.extend({
        respond() {
          return { foo: 'bar' };
        }
      });
      let action = TestAction.create(mockReqRes({
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
