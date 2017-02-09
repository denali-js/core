import test from 'ava';
import path from 'path';
import fs from 'fs';
import { CommandAcceptanceTest } from 'denali';

test('new command > generates an app', async (t) => {
  t.plan(2);
  let newCommand = new CommandAcceptanceTest('new my-denali-app', { populateWithDummy: false });
  let generatedFilepath = path.join(newCommand.dir, 'my-denali-app', 'app', 'application.js');

  await newCommand.run();
  t.true(fs.existsSync(generatedFilepath), 'file should be generated');
});
