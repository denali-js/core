import test from 'ava';
import fs from 'fs';
import path from 'path';
import { CommandAcceptanceTest, assertFileExists, assertPathMissing } from 'denali';


test.beforeEach('generate an action to destroy', async (t) => {
  let generate = new CommandAcceptanceTest('generate action foobar');
  t.context.dir = generate.dir;
  t.context.generatedFilepath = path.join(generate.dir, 'app', 'actions', 'foobar.js');
  await generate.run();
  assertFileExists(t, t.context.generatedFilepath, 'file should be generated');
});

test('destroy command > destroys a blueprint', async (t) => {
  let destroy = new CommandAcceptanceTest('destroy action foobar', { dir: t.context.dir, populateWithDummy: false });

  await destroy.run();
  assertPathMissing(t, t.context.generatedFilepath, 'file should be removed');
});

test('destroy command > skips modified files', async (t) => {
  let destroy = new CommandAcceptanceTest('destroy action foobar', { dir: t.context.dir, populateWithDummy: false });
  fs.appendFileSync(t.context.generatedFilepath, 'foobar');

  await destroy.run();
  assertFileExists(t, t.context.generatedFilepath, 'file should still exist');
});
