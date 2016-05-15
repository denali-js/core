import assert from 'assert';
import { setupApp } from 'denali';

describe('Index action', function() {

  before(function() {
    this.app = setupApp();
  });

  it('should render a hello world object', function() {
    let IndexAction = this.app.lookup('action:index');
    let action = new IndexAction();
    let result = action.render();
    assert(result.hello === 'world');
  });

});
