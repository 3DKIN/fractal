/* eslint handle-callback-err: off, no-unused-expressions: off */

const nunjucks = require('nunjucks');
const _ = require('lodash');
const {Fractal} = require('@frctl/fractal');
const {expect} = require('../../../../test/helpers');
const factory = require('./env');

const fractal = new Fractal();
const env = makeEnv(fractal);

describe('factory', function () {
  it('exports a function', function () {
    expect(factory).to.be.a('function');
  });

  describe('factory()', function () {
    it('returns a fresh Nunjucks environment', function () {
      expect(env).to.be.instanceOf(nunjucks.Environment);
      expect(env).to.not.equal(makeEnv());
    });

    it('promisifies the `renderString` method of the returned environment', function () {
      expect(env.renderString('foo')).to.be.instanceOf(Promise);
    });

    it('promisifies the `render` method of the returned environment', function () {
      const result = env.render('foo.html');
      expect(result).to.be.instanceOf(Promise);
      result.catch(err => {});
    });

    it('leaves other methods untouched', function () {
      expect(env.addFilter('foo', () => {})).to.not.be.instanceOf(Promise);
    });

    it('adds the fractal instance as a property on the environment', function () {
      expect(env.fractal).to.equal(fractal);
    });

    for (const filter of ['await', 'beautify', 'highlight', 'stringify']) {
      it(`adds the ${filter} filter`, function () {
        expect(() => env.getFilter(filter)).to.not.throw(Error);
      });
    }

    // it('adds all lodash functions as filters', function () {
    //   for (const key of Object.keys(_)) {
    //     if (_.isFunction(key)) {
    //       expect(() => env.getFilter(key)).to.not.throw(Error);
    //     }
    //   }
    // });
  });
});

function makeEnv(fractal) {
  return factory(fractal || new Fractal());
}
