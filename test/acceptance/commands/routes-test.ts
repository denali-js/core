import test from 'ava';
import * as dedent from 'dedent-js';
import { CommandAcceptanceTest } from '@denali-js/cli';

test('prints list of configured routes', async (t) => {
  let generate = new CommandAcceptanceTest('routes', { name: 'routes-command' });

  let result = await generate.run({ failOnStderr: false });
  t.true(result.output.trim().endsWith(dedent`
  ┌───────────────────────────┬─────────────────────┐
  │ URL                       │ ACTION              │
  ├───────────────────────────┼─────────────────────┤
  │ GET /                     │ index               │
  ├───────────────────────────┼─────────────────────┤
  │ GET /throws-an-exception/ │ throws-an-exception │
  └───────────────────────────┴─────────────────────┘
  `.trim()));
});
