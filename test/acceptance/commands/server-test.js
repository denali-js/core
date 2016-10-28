import test from 'ava';
import path from 'path';
import { CommandAcceptanceTest } from 'denali';

test('server command > launches a server', async (t) => {
  let server = new CommandAcceptanceTest('server --port 3001');

  return server.spawn({
    env: {
      DENALI_ENV: 'development'
    },
    checkOutput(stdout, stderr) {
      if (stderr.length > 0) {
        t.fail(stderr);
        return true;
      }
      return stdout.indexOf('dummy@0.0.0 server up') > -1;
    }
  });
});

test('server command > launches a server based on the dummy app in an addon', async (t) => {
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
    checkOutput(stdout, stderr) {
      if (stderr.length > 0) {
        t.fail(stderr);
        return true;
      }
      return stdout.indexOf('dummy@0.0.0 server up') > -1;
    }
  });
});
