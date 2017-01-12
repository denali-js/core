import test from 'ava';
import { AppAcceptanceTest } from 'denali';

test('POST /<%= plural.dasherized %> > creates a <%= singular.humanized %>', async (t) => {
  let app = new AppAcceptanceTest();
  let result = await app.post('/<%= plural.name %>', {
      // Add the <%= singular.humanized %> payload here
  });

  t.is(result.status, 201);
  // t.is(result.body.foo, 'bar');
});

test('GET /<%= plural.dasherized %> > should list <%= plural.humanized %>', async (t) => {
  let app = new AppAcceptanceTest();
  let result = await app.get('/<%= plural.name %>');

  t.is(result.status, 200);
  // t.is(result.body.foo, 'bar');
});

test('GET /<%= plural.dasherized %>/:id > should show a <%= singular.humanized %>', async (t) => {
  let app = new AppAcceptanceTest();
  let { body } = await app.post('/<%= plural.name %>', {
      // Add the <%= singular.humanized %> payload here
  });
  let id = body.data.id;

  let result = await app.get(`/<%= plural.name %>/${ id }`);

  t.is(result.status, 200);
  // t.is(result.body.foo, 'bar');
});

test('PATCH /<%= plural.dasherized %>/:id > should update a <%= singular.humanized %>', async (t) => {
  let app = new AppAcceptanceTest();
  let { body } = await app.post('/<%= plural.name %>', {
      // Add the <%= singular.humanized %> payload here
  });
  let id = body.data.id;

  let result = await app.patch(`/<%= plural.name %>/${ id }`, {
      // Add the <%= singular.humanized %> payload here
  });

  t.is(result.status, 200);
  // t.is(result.body.foo, 'bar');
});

test('DELETE /<%= plural.dasherized %>/:id > should delete a <%= singular.humanized %>', async (t) => {
  let app = new AppAcceptanceTest();
  let { body } = await app.post('/<%= plural.name %>', {
      // Add the <%= singular.humanized %> payload here
  });
  let id = body.data.id;

  let result = await app.delete(`/<%= plural.name %>/${ id }`);

  t.is(result.status, 204);
});
