import test from 'ava';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import { CommandAcceptanceTest } from 'denali';

function linkDependency(pkgDir, dependencyName, dependencyDir) {
  let dest = path.join(pkgDir, 'node_modules', dependencyName);
  mkdirp.sync(path.dirname(dest));
  rimraf.sync(dest);
  fs.symlinkSync(dependencyDir, dest);
}

test('server command > launches a server', async () => {
  let server = new CommandAcceptanceTest('server --port 3001', { name: 'launches-a-server' });

  return server.spawn({
    failOnStderr: true,
    env: {
      DEBUG: null
    },
    checkOutput(stdout) {
      return stdout.indexOf('dummy@0.0.0 server up') > -1;
    }
  });
});

test('server command > launches a server based on the dummy app in an addon', async () => {
  let generateAddon = new CommandAcceptanceTest('addon my-denali-addon', { populateWithDummy: false });
  let { stderr } = await generateAddon.run();
  if (stderr) {
    console.warn(stderr); // eslint-disable-line no-console
  }
  linkDependency(path.join(generateAddon.dir, 'my-denali-addon'), 'denali', path.join(process.cwd(), 'node_modules', 'denali'));
  let server = new CommandAcceptanceTest('server --port 3002', {
    dir: path.join(generateAddon.dir, 'my-denali-addon'),
    populateWithDummy: false
  });

  return server.spawn({
    failOnStderr: true,
    checkOutput(stdout) {
      return stdout.indexOf('dummy@0.0.0 server up') > -1;
    }
  });
});
