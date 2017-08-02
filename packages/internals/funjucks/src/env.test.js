/* eslint handle-callback-err: off */

const nunjucks = require('nunjucks');
const {expect} = require('../../../../test/helpers');
const factory = require('./env');

const env = makeEnv();

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

    it('adds the fractal instance as a property on the environment');
  });
});

function makeEnv() {
  const fractal = {}; // TODO: Use proper Fractal instance
  return factory(fractal);
}
