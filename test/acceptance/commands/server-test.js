import test from 'ava';
import path from 'path';
import { CommandAcceptanceTest } from 'denali';

test('server command > launches a server', async () => {
  let server = new CommandAcceptanceTest('server --port 3001');

  return server.spawn({
    env: {
      DENALI_ENV: 'development'
    },
    checkOutput(stdout) {
      return stdout.indexOf('dummy@0.0.0 server up') > -1;
    }
  });
});

test('server command > launches a server based on the dummy app in an addon', async () => {
  let generateAddon = new CommandAcceptanceTest('addon foobar --use-npm', { populateWithDummy: false });
  await generateAddon.run();
  let server = new CommandAcceptanceTest('server --port 3002', {
    dir: path.join(generateAddon.dir, 'foobar'),
    populateWithDummy: false
  });

  return server.spawn({
    env: {
      DENALI_ENV: 'development'
    },
    checkOutput(stdout) {
      return stdout.indexOf('dummy@0.0.0 server up') > -1;
    }
  });
});
