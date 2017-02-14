/* tslint:disable:completed-docs no-empty no-invalid-this member-access */
import test from 'ava';
import * as path from 'path';
import * as fs from 'fs-extra';
import { CommandAcceptanceTest } from 'denali';

test('addon command > generates an addon', async (t) => {
  let addonCommand = new CommandAcceptanceTest('addon my-denali-addon', {
    name: 'addon-command',
    populateWithDummy: false
  });
  await addonCommand.run({ failOnStderr: true });
  let addonFilePath = path.join(addonCommand.dir, 'my-denali-addon', 'app', 'addon.js');
  t.true(fs.existsSync(addonFilePath), `${ addonFilePath } should exist`);
});

test.todo('addon command > fills in the addon name');
test.todo('addon command > initializes a git repo');
