/* tslint:disable:completed-docs no-empty no-invalid-this member-access */
import test from 'ava';
import { MockResponse } from '@denali-js/core';

test.skip('it renders the error view correctly', (t) => {
  let response = new MockResponse();
  let error = new Error();
  response.write = () => {
    t.pass();
    return true;
  };

  t.context.view.render(null, response, error, {});
});
