import { Action, VERSION } from 'denali';

export default Action.extend({

  respond() {
    this.response.json({
      message: 'Welcome to Denali!',
      version: VERSION,
      service: this.testService.foo
    });
  }

});
