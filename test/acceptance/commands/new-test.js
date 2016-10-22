import test from 'ava';
import path from 'path';
import { CommandAcceptanceTest, assertFileExists } from 'denali';

test('new command > generates an app', async (t) => {
  t.plan(2);
  let newCommand = new CommandAcceptanceTest('new foobar', { populateWithDummy: false });
  let generatedFilepath = path.join(newCommand.dir, 'foobar', 'app', 'application.js');

  await newCommand.run();
  assertFileExists(t, generatedFilepath);
});
