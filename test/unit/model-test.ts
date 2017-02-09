import test from 'ava';
import { Model, attr } from 'denali';

test('Model > #eachAttribute > iterates over each attribute', (t) => {
  class TestModel extends Model {
    static foo = attr('text');
    static bar = attr('text');
  }
  let names: string[] = [];
  TestModel.eachAttribute((name) => {
    names.push(name);
  });
  t.deepEqual(names, [ 'foo', 'bar' ]);
});

test('Model > #eachAttribute > iterating over parent classes should not impact child classes', (t) => {
  class Parent extends Model {}
  class Child extends Parent {
    static foo = attr('text');
    static bar = attr('text');
  }
  let names: string[] = [];
  Parent.eachAttribute((name) => {
    names.push(name);
  });
  t.deepEqual(names, []);
  Child.eachAttribute((name) => {
    names.push(name);
  });
  t.deepEqual(names, [ 'foo', 'bar' ]);
});
