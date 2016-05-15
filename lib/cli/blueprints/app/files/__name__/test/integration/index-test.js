import assert from 'assert';
import { setupApp } from 'denali';

describe('GET /', function() {

  before(function() {
    this.app = setupApp();
  });

  it('should return a hello world object', function() {
    return this.app.get('/').then((response) => {
      assert(response.hello === 'world');
    });
  });

});

