import expect from 'must';
import Container from '../../lib/runtime/container';
//const Factory = require('../../lib/runtime/factory');

describe('Denali.Container', function() {

  describe('registering', function() {
    it('should register a value', function() {
      let container = new Container();
      container.register('foo:bar', { buzz: true });
      expect(container.lookup('foo:bar').buzz).to.be.true();
    });
  });

  describe('lookup', function() {

    it('should lookup a module', function() {
      let container = new Container();
      container.register('foo:bar', { buzz: true });
      expect(container.lookup('foo:bar').buzz).to.be.true();
    });

    describe('lookupAll("type")', function() {

      it('should return an object with all the modules of the given type', function() {
        let container = new Container();
        container.register('foo:bar', { buzz: true });
        container.register('foo:buzz', { bat: true });
        let type = container.lookupAll('foo');
        expect(type.bar).to.be.exist();
        expect(type.bar.buzz).to.be.true();
        expect(type.buzz).to.be.exist();
        expect(type.buzz.bat).to.be.true();
      });

    });

    describe('singletons', function() {

      it('should instantiate a singleton', function() {
        let container = new Container();
        class Class {
          static singleton = true
        }
        container.register('foo:bar', new Class());

        let classInstance = container.lookup('foo:bar');
        let classInstanceTwo = container.lookup('foo:bar');
        expect(classInstance).to.be.an.instanceof(Class);
        expect(classInstanceTwo).to.be(classInstance);
      });

      it('should lazily instantiate (i.e. on lookup)', function() {
        let container = new Container();
        let instantiated = false;
        function Class() {
          instantiated = true;
        }
        Class.singleton = true;
        container.register('foo:bar', Class);

        expect(instantiated).to.be.false();
      });

    });

    describe('lookupSerializer', function() {

      it('should inject all serializer singletons into each serializer', function() {
        let container = new Container();
        class SerializerOne {
          static singleton = true
        }
        class SerializerTwo {
          static singleton = true
        }
        container.register('serializer:one', new SerializerOne());
        container.register('serializer:two', new SerializerTwo());

        let serializerOne = container.lookup('serializer:one');
        expect(serializerOne).to.be.an.instanceof(SerializerOne);
        //expect(serializerOne.serializers).to.have.keys([ 'one', 'two' ]);
        //expect(serializerOne.serializers.two).to.be.an.instanceof(SerializerTwo);
      });

    });

    describe('lookupAdapter', function() {

      it('should inject all adapter singletons into each adapter', function() {
        let container = new Container();
        class AdapterOne {
          static singleton = true
        }
        class AdapterTwo {
          static singleton = true
        }
        container.register('adapter:one', new AdapterOne());
        container.register('adapter:two', new AdapterTwo());

        let adapterOne = container.lookup('adapter:one');
        expect(adapterOne).to.be.an.instanceof(AdapterOne);
        //expect(adapterOne.adapters).to.have.keys([ 'one', 'two' ]);
        //expect(adapterOne.adapters.two).to.be.an.instanceof(AdapterTwo);
      });

    });
/*
    describe('Factories', function() {

      it('should run Factory.build() on lookup', function() {
        let built = false;
        let TestFactory = Factory.extend({
          build() {
            built = true;
            return {};
          }
        });
        let container = new Container();
        container.register('foo:bar', TestFactory);

        container.lookup('foo:bar');
        expect(built).to.be.true();
      });

      it('should use the return value of `build()` as the registered value', function() {
        let TestFactory = Factory.extend({
          build() {
            return { ima: 'object' };
          }
        });
        let container = new Container();
        container.register('foo:bar', TestFactory);

        let value = container.lookup('foo:bar');
        expect(value.ima).to.equal('object');
      });

      it('should inject the factory class singleton & instantiate properties onto the returned value', function() {
        let TestFactory = Factory.extend({
          build() {
            return {};
          }
        });
        let container = new Container();
        container.register('foo:bar', TestFactory);

        let value = container.lookup('foo:bar');
        expect(value).to.have.keys([ 'singleton', 'instantiate' ]);
      });

    });
*/
  });
});
