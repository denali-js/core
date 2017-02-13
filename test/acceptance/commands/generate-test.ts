import test from 'ava';
import * as fs from 'fs-extra';
import * as path from 'path';
import { CommandAcceptanceTest } from 'denali';

test('generate command > generates a blueprint', async (t) => {
  t.plan(2);
  let generate = new CommandAcceptanceTest('generate action foobar');
  let generatedFilepath = path.join(generate.dir, 'app', 'actions', 'foobar.js');

  await generate.run();
  t.true(fs.existsSync(generatedFilepath), 'file should be generated');
});

test.todo('generate command > runs blueprints from in-repo');
