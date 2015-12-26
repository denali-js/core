import expect from 'must';
import Action from '../../lib/runtime/action';

describe('actions', function() {
  it('should invoke respond() with params', function() {
    let TestAction = Action.extend({
      respond(params) {
        expect(params.query).to.be.true();
        expect(params.body).to.be.true();
      }
    });
    let action = new TestAction({
      request: {
        query: { query: true },
        body: { body: true }
      },
      response: {
        render() {}
      }
    });
    action._run();
  });

  it('should proxy this.render() to response.render()', function() {
    let TestAction = Action.extend({
      respond() {
        this.render(true);
      }
    });
    let action = new TestAction({
      request: { query: {}, body: {} },
      response: {
        render(value) {
          expect(value).to.be.true();
        }
      }
    });
    action._run();
  });
});
