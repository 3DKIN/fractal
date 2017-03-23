/* eslint no-unused-expressions : "off", handle-callback-err: "off" */

const EventEmitter = require('eventemitter2').EventEmitter2;
const expect = require('@frctl/utils/test').expect;
const ApiBuilder = require('@frctl/internals/api');
const Parser = require('@frctl/internals/parser');
const sinon = require('sinon');
const Fractal = require('../src/fractal');

const entities = ['files', 'components'];
const validConfig = {
  src: './test/fixtures/components'
};

describe('Fractal', function () {
  describe('constructor()', function () {
    it(`throws an error if invalid config is passed in`, function () {
      for (const type of ['string', [], 123]) {
        const fr = () => (new Fractal(type));
        expect(fr).to.throw(TypeError, `[config-invalid]`);
      }
    });

    it(`does not throw an error if a valid config object is passed in`, function () {
      expect(() => new Fractal(validConfig)).to.not.throw(TypeError, `[config-invalid]`);
    });

    it(`does not require a src property to be set`, function () {
      expect(() => new Fractal({})).to.not.throw(TypeError, `[config-invalid]`);
    });

    it(`inherits from EventEmitter`, function () {
      expect(new Fractal({})).to.be.instanceof(EventEmitter);
    });
  });

  describe('.addPlugin()', function () {
    it(`throws an error if called with invalid arguments`, function () {
      const fractal = new Fractal(validConfig);
      expect(() => fractal.addPlugin()).to.throw(TypeError, `[plugin-invalid]`);
      expect(() => fractal.addPlugin(123)).to.throw(TypeError, `[plugin-invalid]`);
      expect(() => fractal.addPlugin(() => {}, 123)).to.throw(TypeError, `[target-invalid]`);
      expect(() => fractal.addPlugin(() => {})).to.not.throw(TypeError, `[plugin-invalid]`);
      expect(() => fractal.addPlugin(() => {}, 'files')).to.not.throw(TypeError, `[target-invalid]`);
    });

    it(`adds the plugin to the appropriate parser`, function () {
      const fractal = new Fractal(validConfig);
      for (const entity of entities) {
        const parser = fractal[entity].parser;
        const plugin = sinon.spy();
        expect(parser.plugins.includes(plugin)).to.be.false;
        fractal.addPlugin(plugin, entity);
        expect(parser.plugins.includes(plugin)).to.be.true;
      }
    });

    it(`adds the plugin to the components parser if a target parser is not specified`, function () {
      const fractal = new Fractal(validConfig);
      const parser = fractal.components.parser;
      const plugin = sinon.spy();
      expect(parser.plugins.includes(plugin)).to.be.false;
      fractal.addPlugin(plugin);
      expect(parser.plugins.includes(plugin)).to.be.true;
    });
  });

  describe('.addMethod()', function () {
    it(`throws an error if called with invalid arguments`, function () {
      const fractal = new Fractal(validConfig);
      expect(() => fractal.addMethod(123)).to.throw(TypeError, `[name-invalid]`);
      expect(() => fractal.addMethod('foo', [])).to.throw(TypeError, `[handler-invalid]`);
      expect(() => fractal.addMethod('foo', () => {})).to.not.throw(TypeError, `[name-invalid]`);
      expect(() => fractal.addMethod('foo', () => {})).to.not.throw(TypeError, `[handler-invalid]`);
    });

    it(`adds the method to the target interface`, function () {
      const fractal = new Fractal(validConfig);
      for (const entity of entities) {
        const api = fractal[entity].api;
        const methodName = `${entity}Test`;
        const method = sinon.spy();
        const data = {};
        expect(api.generate(data)[methodName]).to.be.undefined;
        fractal.addMethod(methodName, method, entity);
        expect(api.generate(data)[methodName]).to.be.a('function');
        api.generate(data)[methodName]();
        expect(method.called).to.be.true;
      }
    });

    it(`adds the method to the components interface if a target interface is not specified`, function () {
      const fractal = new Fractal(validConfig);
      const api = fractal.components.api;
      const methodName = `componentsTest`;
      const method = sinon.spy();
      const data = {};
      expect(api.generate(data)[methodName]).to.be.undefined;
      fractal.addMethod(methodName, method);
      expect(api.generate(data)[methodName]).to.be.a('function');
      api.generate(data)[methodName]();
      expect(method.called).to.be.true;
    });
  });

  describe('.addExtension()', function () {
    it(`throws an error if called with invalid arguments`, function () {
      const fractal = new Fractal(validConfig);
      expect(() => fractal.addExtension(123)).to.throw(TypeError, `[extension-invalid]`);
      expect(() => fractal.addExtension('foobar')).to.throw(TypeError, `[extension-invalid]`);
      expect(() => fractal.addExtension(() => {})).to.not.throw(TypeError, `[extension-invalid]`);
    });

    it(`passes the fractal instance to the extension when registered`, function () {
      const fractal = new Fractal(validConfig);
      const extension = sinon.spy();
      fractal.addExtension(extension);
      expect(extension.calledWith(fractal)).to.be.true;
    });
  });

  describe('.parse()', function () {
    it('throws an error if no callback is provided', function () {
      const fractal = new Fractal(validConfig);
      expect(fractal.parse).to.throw(TypeError, '[callback-invalid]');
    });

    it('calls the callback with component and file APIs when successful ', function (done) {
      const fractal = new Fractal(validConfig);
      fractal.parse((err, components, files) => {
        expect(err).to.equal(null);
        expect(components).to.have.property('$data');
        expect(files).to.have.property('$data');
        done();
      });
    });

    it('calls the callback with an error argument when parsing fails', function (done) {
      const fractal = new Fractal({
        src: '/doesnt/exist'
      });
      fractal.parse(err => {
        expect(err).to.be.instanceof(Error);
        done();
      });
    });

    it('emits a `parse.start` event when starting', function (done) {
      const fractal = new Fractal();
      const startSpy = sinon.spy();
      fractal.on('parse.start', startSpy);
      fractal.parse(done);
      expect(startSpy.called).to.be.true;
    });

    it('emits a `parse.complete` event when finished', function (done) {
      const fractal = new Fractal();
      const endSpy = sinon.spy();
      fractal.on('parse.complete', endSpy);
      fractal.parse(() => {
        expect(endSpy.called).to.be.true;
        done();
      });
    });

    it('processes all the entities in order', function (done) {
      const fractal = new Fractal();
      const stub = sinon.stub(fractal, 'process', function () {
        return Promise.resolve({
          getAll: function () {
            return [];
          }
        });
      });
      fractal.parse(() => {
        expect(stub.callCount).equals(entities.length);
        let i = 0;
        for (const entity of entities) {
          expect(stub.calledWith(entity)).to.be.true;
          expect(stub.getCall(i).calledWith(entity)).to.be.true;
          i++;
        }
        done();
      });
    });
  });

  describe('.files', function () {
    it(`provides access to the files object`, function () {
      const fractal = new Fractal(validConfig);
      expect(fractal.files).to.be.an('object');
      expect(fractal.files.parser).to.be.an.instanceof(Parser);
      expect(fractal.files.api).to.be.an.instanceof(ApiBuilder);
    });
  });

  describe('.components', function () {
    it(`provides access to the components object`, function () {
      const fractal = new Fractal(validConfig);
      expect(fractal.components).to.be.an('object');
      expect(fractal.components.parser).to.be.an.instanceof(Parser);
      expect(fractal.components.api).to.be.an.instanceof(ApiBuilder);
    });
  });

  describe('.adapters', function () {
    it(`provides access to the set of registered adapters`, function () {
      const fractal = new Fractal(validConfig);
      const adapterExample = {
        name: 'adapter',
        match: '.someext',
        render() {}
      };
      fractal.addAdapter(adapterExample);
      expect(fractal.adapters).to.be.an('array');
      expect(fractal.adapters.length).to.equal(1);
      expect(Boolean(fractal.adapters.find(adapter => adapter.name === 'adapter'))).to.be.true;
    });
  });
});
