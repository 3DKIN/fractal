  const {forEach} = require('lodash');
const App = require('@frctl/app');
const {Fractal} = require('@frctl/fractal');
const debug = require('debug')('frctl:pages');
const {assert} = require('check-types');
const Router = require('./router');
const Config = require('./config/store');

const _fractal = new WeakMap();

class Pages extends App {

  constructor(fractal, config = {}) {
    assert.instance(fractal, Fractal, 'Pages.constructor - first argument must be an instance of Fractal [fractal-required]');
    super(new Config(config));
    _fractal.set(this, fractal);
    this.debug('instantiated new Pages instance');
  }

  async build() {
    const pages = await this.getPages();
    // render pages
    // write to disk
    return pages;
  }

  serve(opts = {}) {

  }

  async getPages() {
    const library = await this.fractal.parse();
    const site = await this.parse();
    const router = new Router();

    forEach(this.get('routes', {}), builder => {
      router.addRoute(builder, {site, library}, this);
    });

    return router.getPages();
  }

  debug(...args) {
    debug(...args);
    return this;
  }

  get fractal() {
    return _fractal.get(this);
  }

  get version() {
    return require('../package.json').version;
  }

  get [Symbol.toStringTag]() {
    return 'Pages';
  }

}

module.exports = Pages;
