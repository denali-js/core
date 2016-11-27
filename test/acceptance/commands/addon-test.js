import test from 'ava';
import path from 'path';
import { CommandAcceptanceTest, assertFileExists } from 'denali';

test('addon command > generates an addon', async (t) => {
  let addonCommand = new CommandAcceptanceTest('addon my-denali-addon --use-npm', { populateWithDummy: false });
  await addonCommand.run();
  assertFileExists(t, path.join(addonCommand.dir, 'my-denali-addon', 'app', 'addon.js'));
});

test.todo('addon command > fills in the addon name');
test.todo('addon command > initializes a git repo');
