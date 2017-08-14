const {join} = require('path');
const {File, ComponentCollection, FileCollection} = require('@frctl/support');
const {Renderer} = require('@frctl/renderer');
const {expect, sinon} = require('../../../../test/helpers');
const pkg = require('../package.json');
const Fractal = require('./fractal');
const ParserCache = require('./parser-cache');

const config = {
  src: join(__dirname, '../../../../test/fixtures/components'),
  extends: null,
  commands: [
    './test/fixtures/add-ons/command.js'
  ],
  adapters: [
    './test/fixtures/add-ons/adapter.js'
  ]
};

const view = new File({
  path: 'path/to/view.fjk',
  contents: Buffer.from('file contents')
});

describe('Fractal', function () {
  describe('constructor()', function () {
    it('accepts configuration data', () => {
      const fractal = new Fractal(config);
      expect(fractal.config).to.eql(config);
    });

    it('throws an error if invalid config data is provided', () => {
      expect(() => new Fractal({commands: 'foo'})).to.throw('[config-invalid]');
    });

    it('does not throw an error if no config data is provided', () => {
      expect(() => new Fractal()).to.not.throw();
    });

    it('sets the dirty flag to true', () => {
      const fractal = new Fractal();
      expect(fractal.dirty).to.equal(true);
    });
  });

  describe('.get()', function () {
    it('retrieves a value from the config data', () => {
      const fractal = new Fractal(config);
      expect(fractal.get('foo')).to.equal(config.foo);
    });

    it('accepts a fallback argument which is returned if the property is undefined', () => {
      const fractal = new Fractal(config);
      const fallback = 'whoops!';
      expect(fractal.get('boop', fallback)).to.equal(fallback);
    });
  });

  describe('.parse()', function () {
    it('returns a Promise', function () {
      const fractal = new Fractal();
      expect(fractal.parse()).to.be.instanceOf(Promise);
    });
    it('resolves to an object with file and component collections', async function () {
      const fractal = new Fractal();
      const {components, files} = await fractal.parse();
      expect(components).to.be.instanceOf(ComponentCollection);
      expect(files).to.be.instanceOf(FileCollection);
    });
    it('returns the cached result if valid', async function () {
      const fractal = new Fractal();
      const collections = await fractal.parse();
      const collections2 = await fractal.parse();
      expect(collections).to.equal(collections2);
      fractal.dirty = true;
      const collections3 = await fractal.parse();
      expect(collections3).to.not.equal(collections);
      expect(collections3).to.not.equal(collections2);
    });
  });

  describe('.render()', function () {
    it('returns a Promise', function () {
      const fractal = new Fractal(config);
      expect(fractal.render(view)).to.be.instanceOf(Promise);
    });
    it('resolves to a string', async function () {
      const fractal = new Fractal(config);
      expect(await fractal.render(view)).to.be.a('string');
    });
  });

  describe('.getComponents()', function () {
    it('returns a Promise', function () {
      const fractal = new Fractal();
      expect(fractal.getComponents()).to.be.instanceOf(Promise);
    });
    it('resolves to a ComponentCollection instance', async function () {
      const fractal = new Fractal();
      const components = await fractal.getComponents();
      expect(components).to.be.instanceOf(ComponentCollection);
    });
  });

  describe('.getFiles()', function () {
    it('returns a Promise', function () {
      const fractal = new Fractal();
      expect(fractal.getComponents()).to.be.instanceOf(Promise);
    });
    it('resolves to a FileCollection instance', async function () {
      const fractal = new Fractal();
      const files = await fractal.getFiles();
      expect(files).to.be.instanceOf(FileCollection);
    });
  });

  describe('.toString()', function () {
    it('property describes the Fractal instance', function () {
      const fractal = new Fractal();
      expect(fractal.toString()).to.equal('[object Fractal]');
    });
  });

  describe('.dirty', function () {
    it('gets and sets the dirty property', function () {
      const fractal = new Fractal();
      fractal.dirty = false;
      expect(fractal.dirty).to.equal(false);
      fractal.dirty = true;
      expect(fractal.dirty).to.equal(true);
    });
    it('clears the cache when set to true', function () {
      const fractal = new Fractal();
      const spy = sinon.spy(fractal.cache, 'clear');
      fractal.dirty = true;
      expect(spy.called).to.equal(true);
      spy.reset();
      fractal.dirty = false;
      expect(spy.called).to.equal(false);
      spy.restore();
    });
  });

  describe('.cache', function () {
    it('returns the parser cache instance', function () {
      const fractal = new Fractal();
      expect(fractal.cache).to.be.instanceof(ParserCache);
    });
  });

  describe('.renderer', function () {
    it('returns the renderer instance', function () {
      const fractal = new Fractal();
      expect(fractal.renderer).to.be.instanceof(Renderer);
    });
  });

  describe('.config', function () {
    it('returns the config data', function () {
      const fractal = new Fractal({
        foo: 'bar'
      });
      expect(fractal.config).to.be.an('object').with.property('foo').that.equals('bar');
    });
    it('is cloned so that the config is not mutable', function () {
      const fractal = new Fractal({
        foo: 'bar'
      });
      fractal.config.foo = 'oops';
      expect(fractal.get('foo')).to.equal('bar');
    });
  });

  describe('.version', function () {
    it('returns the version number from the package.json file', function () {
      const fractal = new Fractal();
      expect(fractal.version).to.equal(pkg.version);
    });
  });

  describe('.isFractal', function () {
    it('is true', function () {
      const fractal = new Fractal();
      expect(fractal.isFractal).to.equal(true);
    });
  });
});
