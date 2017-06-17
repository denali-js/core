import test, { TestContext, Context } from 'ava';
import { Model, Container, DatabaseService } from 'denali';
import { isArray } from 'lodash';

test.beforeEach((t) => {
  t.context.container = new Container(__dirname);
});

// Ensure a given finder method invokes it's corresponding adapter method
async function finderInvokesAdapter(t: TestContext & Context<any>, finder: keyof DatabaseService, adapterReturn: any, ...args: any[]) {
  t.plan(1);
  let container: Container = t.context.container;
  container.register('service:db', DatabaseService);
  container.register('model:post', class Post extends Model {});
  container.register('orm-adapter:post', {
    buildRecord() { return {}; },
    [finder]() {
      t.pass();
      return adapterReturn;
    },
    getAttribute(): any { return null; }
  }, { instantiate: false, singleton: true });
  let db = container.lookup<DatabaseService>('service:db');
  await (<any>db[finder])('post', ...args);
}
(<any>finderInvokesAdapter).title = (providedTitle: string, finder: string) => `db.${ finder } invokes the ${ finder } method on the adapter`;

// Check the results of a finder method call, and stub out the corresponding adapter method
async function finderReturns(t: TestContext & Context<any>, options: {
  finder: keyof DatabaseService,
  arg: any,
  adapterMethod(): any,
  assert(t: TestContext, result: any): void
}) {
  t.plan(1);
  let container: Container = t.context.container;
  container.register('service:db', DatabaseService);
  container.register('model:post', class Post extends Model {});
  container.register('orm-adapter:post', {
    buildRecord() { return {}; },
    [options.finder]: options.adapterMethod,
    getAttribute(): null { return null; }
  }, { instantiate: false, singleton: true });
  let db = container.lookup<DatabaseService>('service:db');
  let result = await (<any>db[options.finder])('post', options.arg);
  options.assert(t, result);
}

test(finderInvokesAdapter, 'find', {}, 1);

test(finderInvokesAdapter, 'queryOne', {}, { foo: true });

test(finderInvokesAdapter, 'all', []);

test(finderInvokesAdapter, 'query', [], { foo: true });

test('find returns model instance', finderReturns, {
  finder: 'find',
  arg: 1,
  adapterMethod() { return {}; },
  assert(t: TestContext, result: any) {
    t.true(result instanceof Model);
  }
});

test('find returns null if adapter does', finderReturns, {
  finder: 'find',
  arg: 1,
  adapterMethod(): null { return null; },
  assert(t: TestContext, result: any) {
    t.is(result, null);
  }
});

test('queryOne returns model instance', finderReturns, {
  finder: 'queryOne',
  arg: { foo: true },
  adapterMethod() { return {}; },
  assert(t: TestContext, result: any) {
    t.true(result instanceof Model);
  }
});

test('queryOne returns null if adapter does', finderReturns, {
  finder: 'queryOne',
  arg: { foo: true },
  adapterMethod(): null { return null; },
  assert(t: TestContext, result: any) {
    t.is(result, null);
  }
});

test('all returns an array', finderReturns, {
  finder: 'all',
  arg: undefined,
  adapterMethod(): any[] { return []; },
  assert(t: TestContext, result: any) {
    t.true(isArray(result));
  }
});

test('query returns an array', finderReturns, {
  finder: 'query',
  arg: { foo: true },
  adapterMethod(): any[] { return []; },
  assert(t: TestContext, result: any) {
    t.true(isArray(result));
  }
});
