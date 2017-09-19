/* tslint:disable:completed-docs no-empty no-invalid-this member-access */
import ava, { RegisterContextual } from 'ava';
import { Container, MemoryAdapter, hasMany } from 'denali';

const test = <RegisterContextual<{ container: Container, adapter: MemoryAdapter }>>ava;

async function buildAndSave(adapter: MemoryAdapter, type: string, data: any) {
  let record = adapter.buildRecord(type, data);
  let model = <any>{
    type,
    record,
    get id() {
      return this.record.id;
    }
  };
  await adapter.saveRecord(model);
  return model;
}

test.beforeEach(async (t) => {
  t.context.container = new Container(__dirname);
  t.context.adapter = new MemoryAdapter(<any>{});
});

test('find returns record with given id', async (t) => {
  let { adapter } = t.context;
  let model = await buildAndSave(adapter, 'foo', { bar: true });

  let result = await adapter.find('foo', model.record.id);
  t.deepEqual(result, model.record);
});

test('find returns null for non-existent id', async (t) => {
  let { adapter } = t.context;

  t.is(await adapter.find('whatever', 0), null);
});

test('queryOne returns the first record that matches the given query', async (t) => {
  let { adapter } = t.context;
  let type = 'foo';
  let matching = await buildAndSave(adapter, type, { number: 'one', bar: true });
  await buildAndSave(adapter, type, { number: 'two', bar: true });
  await buildAndSave(adapter, type, { number: 'three', bar: false });

  let result = await adapter.queryOne(type, { bar: true });
  t.deepEqual(result, matching.record);
});

test('queryOne returns null if query does not match anything', async (t) => {
  let { adapter } = t.context;

  t.is(await adapter.queryOne('whatever', { whatever: true }), null);
});

test('all returns all records', async (t) => {
  let { adapter } = t.context;
  let type = 'foo';
  let modelOne = await buildAndSave(adapter, type, { number: 'one' });
  let modelTwo = await buildAndSave(adapter, type, { number: 'two' });

  let result = await adapter.all(type);
  t.deepEqual(result, [ modelOne.record, modelTwo.record ]);
});

test('query returns all records that match a given query', async (t) => {
  let { adapter } = t.context;
  let type = 'foo';
  let matchingOne = await buildAndSave(adapter, type, { number: 'one', bar: true });
  let matchingTwo = await buildAndSave(adapter, type, { number: 'two', bar: true });
  await buildAndSave(adapter, type, { number: 'three', bar: false });

  let result = await adapter.query(type, { bar: true });
  t.deepEqual(result, [ matchingOne.record, matchingTwo.record ]);
});

test('get and set attributes', async (t) => {
  let { adapter } = t.context;
  let record = adapter.buildRecord('foo', { bar: true });
  let model = <any>{ record };
  adapter.setAttribute(model, 'bar', false);
  adapter.setAttribute(model, 'fizz', 'buzz');

  t.is(adapter.getAttribute(model, 'bar'), false);
  t.is(adapter.getAttribute(model, 'fizz'), 'buzz');
});

test('getRelated returns related records', async (t) => {
  let { adapter } = t.context;
  let post = await buildAndSave(adapter, 'post', {});
  let comment = await buildAndSave(adapter, 'comment', { text: 'great post!' });
  let descriptor = hasMany('comment');
  adapter.setRelated(post, 'comments', descriptor, [ comment ]);

  let result = await adapter.getRelated(post, 'comments', descriptor, null);
  t.deepEqual(result, [ comment.record ]);
});

test('setRelated replaces related records', async (t) => {
  let { adapter } = t.context;
  let post = await buildAndSave(adapter, 'post', {});
  let comment = await buildAndSave(adapter, 'comment', { text: 'great post!' });
  let descriptor = hasMany('comment');
  adapter.setRelated(post, 'comments', descriptor, [ comment ]);
  let sanityCheck = await adapter.getRelated(post, 'comments', descriptor, null);
  t.deepEqual(sanityCheck, [ comment.record ]);

  let newComment = await buildAndSave(adapter, 'comment', { text: 'even greater post!' });
  adapter.setRelated(post, 'comments', descriptor, [ newComment ]);

  let result = await adapter.getRelated(post, 'comments', descriptor, null);
  t.deepEqual(result, [ newComment.record ]);
});

test('addRelated adds a related record to a has many relationship', async (t) => {
  let { adapter } = t.context;
  let post = await buildAndSave(adapter, 'post', {});
  let comment = await buildAndSave(adapter, 'comment', { text: 'great post!' });
  let descriptor = hasMany('comment');
  adapter.setRelated(post, 'comments', descriptor, [ comment ]);
  let sanityCheck = await adapter.getRelated(post, 'comments', descriptor, null);
  t.deepEqual(sanityCheck, [ comment.record ]);

  let newComment = await buildAndSave(adapter, 'comment', { text: 'even greater post!' });
  adapter.addRelated(post, 'comments', descriptor, newComment);

  let result = await adapter.getRelated(post, 'comments', descriptor, null);
  t.deepEqual(result, [ comment.record, newComment.record ]);
});

test('removeRelated destroys a relationship between related records', async (t) => {
  let { adapter } = t.context;
  let post = await buildAndSave(adapter, 'post', {});
  let comment = await buildAndSave(adapter, 'comment', { text: 'great post!' });
  let descriptor = hasMany('comment');
  adapter.setRelated(post, 'comments', descriptor, [ comment ]);
  let sanityCheck = await adapter.getRelated(post, 'comments', descriptor, null);
  t.deepEqual(sanityCheck, [ comment.record ]);

  adapter.removeRelated(post, 'comments', descriptor, comment);

  let result = await adapter.getRelated(post, 'comments', descriptor, null);
  t.deepEqual(result, []);
});
