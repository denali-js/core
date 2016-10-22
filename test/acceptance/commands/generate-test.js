import test from 'ava';
import path from 'path';
import { CommandAcceptanceTest, assertFileExists } from 'denali';

test('generate command > generates a blueprint', async (t) => {
  t.plan(2);
  let generate = new CommandAcceptanceTest('generate action foobar');
  let generatedFilepath = path.join(generate.dir, 'app', 'actions', 'foobar.js');

  await generate.run();
  assertFileExists(t, generatedFilepath, 'file should exist');
});

test.todo('generate command > runs blueprints from in-repo');
