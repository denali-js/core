import assert from 'assert';

export default function inject(name) {
  return new Injection(name);
}

export class Injection {
  constructor(name) {
    this.injectedName = name;
    this.getter = function() {
      assert('You must provide a container instance to a class with injections.', this.container);
      return this.container.lookup(name);
    };
  }

  setter() {
    throw new Error('You cannot modify an injected value.');
  }
}
