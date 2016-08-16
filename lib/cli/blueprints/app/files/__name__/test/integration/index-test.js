import expect from 'must';
import { setupApp } from 'denali';

describe('Index action', function() {
  before(function() {
    this.app = setupApp();
  });

  it('should render a hello world object', function() {
    let IndexAction = this.app.lookup('action:index');
    let action = new IndexAction();
    let result = action.render();
    expect(result.hello).to.equal('world');
  });
});

describe('GET /', function() {
  before(function() {
    this.app = setupApp();
  });

  it('should return a welcome message', function() {
    return this.app.get('/').then(({ body }) => {
      expect(body.message).to.equal('Welcome to Denali!');
    });
  });
});
