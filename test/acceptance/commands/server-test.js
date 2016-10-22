import test from 'ava';
import { CommandAcceptanceTest } from 'denali';

test('server command > launches a server', async () => {
  let server = new CommandAcceptanceTest('server');

  return server.spawn({
    env: {
      DENALI_ENV: 'development'
    },
    checkOutput(stdout) {
      return stdout.indexOf('dummy@0.0.0 server up') > -1;
    }
  });
});
