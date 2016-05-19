import expect from 'must';
import { setupApp } from 'denali';

describe('Index action', function() {

  before(function() {
    this.app = setupApp();
  });

  it('should render a hello world object', function() {
    let IndexAction = this.app.lookup('action:index');
    let action = new IndexAction();
    let response = action.respond();
    expect(response.body.message).to.equal('Welcome to Denali!');
  });

});
