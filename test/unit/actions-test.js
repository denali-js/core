import expect from 'must';
import Action from '../../lib/runtime/action';
import merge from 'lodash/object/merge';

function mockReqRes(overrides) {
  return merge({
    request: {
      query: {},
      body: {}
    },
    response: {
      render() {}
    },
    next() {}
  }, overrides);
}

describe('actions', function() {
  it('should invoke respond() with params', function() {
    let TestAction = Action.extend({
      respond(params) {
        expect(params.query).to.be.true();
        expect(params.body).to.be.true();
      }
    });
    let action = new TestAction(mockReqRes({
      request: {
        query: { query: true },
        body: { body: true }
      }
    }))
    action.run();
  });

  it('should proxy this.render() to response.render()', function() {
    let TestAction = Action.extend({
      respond() {
        this.render(true);
      }
    });
    let action = new TestAction(mockReqRes({
      response: {
        render(value) {
          expect(value).to.be.true();
        }
      }
    }));
    action.run();
  });
});
