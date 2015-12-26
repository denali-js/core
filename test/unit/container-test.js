import expect from 'must';
import mockFS from 'mock-fs';
import Container from '../../lib/runtime/container';

describe('Container', function() {
  describe('registering', function() {
    it('should register a value', function() {
      let container = new Container();
      container.register('foo', true);
      expect(container._registry.get('foo')).to.be.true();
    });
    describe('registerDir', function() {
      before(function() {
        mockFS({
          'foo': {
            'one.js': 'exports.test = true',
            'two.js': 'exports.test = true',
            'three.js': 'exports.test = true'
          }
        });
      });
      after(function() {
        mockFS.restore();
      });

      it('should register a directory of files under their basenames and the supplied type', function() {
        let container = new Container();
        container.registerDir('foo', 'tests');
        expect(container._registry.get('tests/one').test).to.be.true();
        expect(container._registry.get('tests/two').test).to.be.true();
        expect(container._registry.get('tests/three').test).to.be.true();
      });
    });
  });

  describe('lookup', function() {
    it('should lookup a module', function() {
      let container = new Container();
      container.register('foo', true);
      expect(container.lookup('foo')).to.be.true();
    });

    describe('lookupType', function() {
      it('should return an object with all the modules of the given type', function() {
        let container = new Container();
        container.register('tests/foo', true);
        container.register('tests/bar', true);
        let type = container.lookupType('tests');
        expect(type.foo).to.be.true();
        expect(type.bar).to.be.true();
      });
    });
  });
});
