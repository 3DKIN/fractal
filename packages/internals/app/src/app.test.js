/* eslint import/no-dynamic-require: off,  no-unused-expressions: off */

const {writeFileSync, mkdirSync} = require('fs');
const {EventEmitter} = require('events');
const {tmpdir} = require('os');
const {join} = require('path');
const {capitalize, omit} = require('lodash');
const {FileCollection, Collection, EmittingPromise} = require('@frctl/support');
const {Config} = require('@frctl/config');
const {Parser} = require('@frctl/parser');
const {Loader} = require('@frctl/loader');
const Cache = require('node-cache');
const {FSWatcher} = require('chokidar');
const proxyquire = require('proxyquire');
const {expect, sinon} = require('../../../../test/helpers');
const App = require('./app');

const config = {
  src: join(__dirname, '../../../../test/fixtures/components'),
  plugins: [],
  transforms: []
};

const tmp = join(tmpdir(), Date.now().toString());

mkdirSync(tmp);

function writeFile(name, contents) {
  writeFileSync(join(tmp, name), contents);
}

function makeApp(customConfig) {
  return new App(customConfig || config);
}

describe('App', function () {
  describe('constructor()', function () {
    it('accepts configuration data', () => {
      const app = makeApp();
      expect(app.config.data).to.eql(config);
    });
    it('does not throw an error if no config data is provided', () => {
      expect(() => new App()).to.not.throw();
    });
    it('sets the dirty flag to true', () => {
      const app = new App();
      expect(app.dirty).to.equal(true);
    });
  });

  describe('.get()', function () {
    it('retrieves a value from the config data', () => {
      const app = makeApp();
      expect(app.get('foo')).to.equal(config.foo);
    });
    it('accepts a fallback argument which is returned if the property is undefined', () => {
      const app = makeApp();
      const fallback = 'whoops!';
      expect(app.get('boop', fallback)).to.equal(fallback);
    });
  });

  describe('.set()', function () {
    it('sets a value in the config data', () => {
      const app = makeApp();
      app.set('foo.bar', 'baz');
      expect(app.get('foo.bar')).to.equal('baz');
    });
    it('sets the dirty flag', () => {
      const app = makeApp();
      app.dirty = false;
      app.set('foo.bar', 'baz');
      expect(app.dirty).to.equal(true);
    });
  });

  describe('.parse()', function () {
    it('returns an EmittingPromise', function () {
      const app = new App();
      expect(app.parse()).to.be.instanceOf(EmittingPromise);
    });
    it('resolves to an object with a file collection', async function () {
      const app = new App();
      const {files} = await app.parse();
      expect(files).to.be.instanceOf(FileCollection);
    });
    it('calls the parser.run method with the current App instance as context', async function () {
      const spy = sinon.spy(() => Promise.resolve({}));
      class Parser {
        run(...args) {
          spy(...args);
          return Promise.resolve({});
        }
      }
      const App = proxyquire('./app', {
        '@frctl/parser': {Parser}
      });
      const app = new App();
      await app.parse();
      expect(spy.calledWith({context: app})).to.be.equal(true);
    });
    it('uses the cached result if valid', async function () {
      const app = new App();
      const spy = sinon.spy(app.cache, 'get');
      const collections = await app.parse();
      expect(spy.called).to.equal(true);
      expect(spy.returned(collections)).to.equal(false);
      spy.reset();
      const cachedCollections = await app.parse();
      expect(spy.returned(cachedCollections)).to.equal(true);
      spy.restore();
    });
    it('rejects if an error is thrown by the parser', async function () {
      const app = new App();
      const stub = sinon.stub(app, 'getParser').callsFake(function () {
        return {
          run() {
            return Promise.reject(new Error('oops!'));
          }
        };
      });
      let tested = false;
      try {
        await app.parse();
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        tested = true;
        stub.restore();
      }
      expect(tested).to.equal(true);
    });
    it('supports providing a custom emitter via opts.emitter', function (done) {
      const app = new App();
      const emitter = new EventEmitter();
      emitter.on('parse.start', function () {
        expect(this).to.equal(emitter);
        done();
      });
      app.parse({emitter});
    });
  });

  describe('.watch()', function () {
    let app;
    let watcher;
    beforeEach(function () {
      app = new App({
        src: [tmp + '/**/*']
      });
      watcher = app.watch();
    });
    afterEach(function () {
      watcher.close();
    });
    it('returns a chokidar instance', function () {
      expect(watcher).to.be.instanceOf(FSWatcher);
    });
    it('returns the same instance if called twice', function () {
      const sameWatcher = app.watch();
      expect(watcher).to.equal(sameWatcher);
    });
    it('sets the chokidar opts correctly', function () {
      expect(watcher.options.ignoreInitial).to.equal(true);
      expect(watcher.options.cwd).to.equal(process.cwd());
    });
    it('sets the dirty flag when the filesystem changes', function (done) {
      if (process.env.IS_CI) {
        this.skip();
      }
      watcher.on('all', function () {
        expect(app.dirty).to.equal(true);
        done();
      });
      app.dirty = false;
      watcher.on('ready', () => writeFile('foo.js'));
    });
  });

  describe('.unwatch()', function () {
    let app;
    let watcher;
    beforeEach(function () {
      app = new App({
        src: [tmp + '/**/*']
      });
      watcher = app.watch();
    });
    afterEach(function () {
      watcher.close();
    });
    it('closes the chokidar instance', function () {
      app.unwatch();
      expect(watcher.closed).to.equal(true);
    });
    it('removes the instance so the next call to watch() initializes a fresh one', function () {
      app.unwatch();
      const newWatcher = app.watch();
      expect(watcher).to.not.equal(newWatcher);
    });
  });

  for (const addOn of ['plugin', 'transform']) {
    const method = `add${capitalize(addOn)}`;
    describe(`.${method}()`, function () {
      it(`adds a ${addOn} to the ${addOn}s config array`, function () {
        const app = new App({presets: null});
        expect(app.get(`${addOn}s`)).to.be.an('array').and.have.property('length').which.equals(0);
        app[method](`./test/fixtures/add-ons/${addOn}`);
        expect(app.get(`${addOn}s`).length).equal(1);
      });
      it(`marks the app instance as dirty`, function () {
        const app = new App({presets: null});
        app.dirty = false;
        app[method](`./test/fixtures/add-ons/${addOn}`);
        expect(app.dirty).to.equal(true);
      });
      it(`returns the App instance`, function () {
        const app = new App({presets: null});
        expect(app[method](`./test/fixtures/add-ons/${addOn}`)).to.equal(app);
      });
    });
  }

  describe('.getLoader()', function () {
    it('returns a Loader instance', function () {
      const app = makeApp();
      expect(app.getLoader()).to.be.instanceOf(Loader);
    });
    it('passes the resolve config object to the loader', function () {
      const App = proxyquire('./app', {
        '@frctl/loader': {
          Loader: function (opts = {}) {
            this.opts = opts;
          }
        }
      });
      const config = {
        resolve: {
          alias: {
            '~': join(__dirname, '../test/fixtures')
          }
        }
      };
      const app = new App(config);
      const loader = app.getLoader();
      expect(omit(loader.opts, ['fileSystem'])).to.eql(config.resolve);
    });
    it('passes the fileSystem argument to the loader in opts', function () {
      const App = proxyquire('./app', {
        '@frctl/loader': {
          Loader: function (opts = {}) {
            this.opts = opts;
          }
        }
      });
      const app = new App();
      const fileSystem = {};
      const loader = app.getLoader(fileSystem);
      expect(loader.opts.fileSystem).to.equal(fileSystem);
    });
    it('converts a FileCollections instance argument to a MemoryFS instance before insantiating the loader', function () {
      const App = proxyquire('./app', {
        '@frctl/loader': {
          Loader: function (opts = {}) {
            this.opts = opts;
          }
        }
      });
      const app = new App();
      const fileSystem = new FileCollection();
      const memFs = fileSystem.toMemoryFS();
      const loader = app.getLoader(fileSystem);
      expect(loader.opts.fileSystem).to.eql(memFs);
    });
  });

  describe('.require()', function () {
    it('returns an Promise', function () {
      const app = makeApp();
      expect(app.require('../package.json', __dirname)).to.be.instanceOf(Promise);
    });
    it('instantiates a loader with the current FileCollection', async () => {
      const app = makeApp();
      const files = new FileCollection();
      sinon.stub(app, 'getFiles').callsFake(() => files);
      const spy = sinon.spy(app, 'getLoader');
      await app.require('../package.json', __dirname);
      expect(spy.calledWith(files)).to.equal(true);
    });

    it('throws an error if the file is not found', () => {
      const app = makeApp();
      expect(app.require('~/parent')).to.be.rejectedWith('[resolver-error]');
    });
    it('calls the loader.require method with the expect args', async () => {
      let passedArgs = [];
      class Loader {
        require(...args) {
          passedArgs = args;
        }
      }
      const App = proxyquire('./app', {
        '@frctl/loader': {Loader}
      });
      const app = new App();
      await app.require('../package.json', __dirname);
      expect(passedArgs[0]).to.equal('../package.json');
      expect(passedArgs[1]).to.equal(__dirname);
    });
  });

  describe('.requireFromString()', function () {
    it('returns an Promise', function () {
      const app = makeApp();
      expect(app.requireFromString('module.exports = {}', 'foo.js')).to.be.instanceOf(Promise);
    });
    it('instantiates a loader with the current FileCollection', async () => {
      const app = makeApp();
      const files = new FileCollection();
      sinon.stub(app, 'getFiles').callsFake(() => files);
      const spy = sinon.spy(app, 'getLoader');
      await app.requireFromString('module.exports = {}', 'foo.js');
      expect(spy.calledWith(files)).to.equal(true);
    });

    it('calls the loader.requireFromString method with the expect args', async () => {
      let passedArgs = [];
      class Loader {
        requireFromString(...args) {
          passedArgs = args;
        }
      }
      const App = proxyquire('./app', {
        '@frctl/loader': {Loader}
      });
      const app = new App();
      await app.requireFromString('module.exports = {}', 'foo.js');
      expect(passedArgs[0]).to.equal('module.exports = {}');
      expect(passedArgs[1]).to.equal('foo.js');
    });
  });

  describe('.getCollections()', function () {
    it('is an alias for .parse()', async function () {
      const app = makeApp();
      const spy = sinon.spy(app, 'parse');
      app.getCollections();
      expect(spy.called).to.equal(true);
    });
  });

  describe('.getFiles()', function () {
    it('returns an EmittingPromise', function () {
      const app = makeApp();
      expect(app.getFiles()).to.be.instanceOf(EmittingPromise);
    });
    it('resolves to a FileCollection instance', async function () {
      const app = makeApp();
      const files = await app.getFiles();
      expect(files).to.be.instanceOf(FileCollection);
    });
  });

  describe('.getParser()', function () {
    it('returns a new Parser instance', function () {
      const app = new App();
      const parser = app.getParser();
      expect(parser).to.be.instanceOf(Parser);
      expect(app.getParser()).to.not.equal(parser);
    });
    it('initialises the parser with src, plugins and transforms from the config', function () {
      const app = new App({
        src: ['/foo'],
        plugins: [
          {
            name: 'foo-plugin',
            transform: 'tests',
            handler: function () {}
          }
        ],
        transforms: [
          {
            name: 'tests',
            transform: function () {
              return new Collection();
            }
          }
        ]
      });
      const parser = app.getParser();
      expect(parser.sources.map(src => src.base)[0]).to.equal('/foo');
      expect(parser.getTransform('tests')).to.have.property('name').that.equals('tests');
      expect(parser.getTransform('tests').plugins.items.map(plugin => plugin.name)).to.include('foo-plugin');
    });
  });

  describe('.dirty', function () {
    it('gets and sets the dirty property', function () {
      const app = new App();
      app.dirty = false;
      expect(app.dirty).to.equal(false);
      app.dirty = true;
      expect(app.dirty).to.equal(true);
    });
    it('clears the cache when set to true', function () {
      const app = new App();
      const spy = sinon.spy(app.cache, 'del');
      app.dirty = true;
      expect(spy.called).to.equal(true);
      spy.reset();
      app.dirty = false;
      expect(spy.called).to.equal(false);
      spy.restore();
    });
  });

  describe('.cache', function () {
    it('returns the application cache instance', function () {
      const app = new App();
      expect(app.cache).to.be.instanceof(Cache);
    });
  });

  describe('.config', function () {
    it('returns the config instance', function () {
      const app = new App({
        foo: 'bar'
      });
      expect(Config.isConfig(app.config)).to.equal(true);
    });
  });
});
