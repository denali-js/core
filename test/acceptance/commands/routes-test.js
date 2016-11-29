import test from 'ava';
import dedent from 'dedent-js';
import { CommandAcceptanceTest } from 'denali';

test('routes command > prints list of configured routes', async (t) => {
  let generate = new CommandAcceptanceTest('routes');

  let result = await generate.run({ failOnStderr: true });
  t.is(result.stdout.trim(), dedent`
┌───────┬────────┐
│ URL   │ ACTION │
├───────┼────────┤
│ GET / │ index  │
└───────┴────────┘
  `);
});
