/* eslint no-unused-expressions: "off" */
const {expect} = require('../../../../../test/helpers');
const Variant = require('./variant');
const Entity = require('./entity');

const defaultProps = {
  id: 'variant'
};

const makeVariant = props => new Variant(props || defaultProps);

describe('Variant', function () {
  describe('constructor', function () {
    it(`creates a new instance of a Variant with expected superclass`, function () {
      const variant = makeVariant();
      expect(variant).to.exist;
      expect(variant instanceof Variant).to.be.true;
      expect(variant instanceof Entity).to.be.true;
    });
    it(`throws an error when invalid props supplied`, function () {
      expect(() => makeVariant(['invalid', 'array'])).to.throw(TypeError, '[properties-invalid]');
      expect(() => makeVariant('invalid string')).to.throw(TypeError, '[properties-invalid]');
    });
  });

  describe('.label', function () {
    it('is generated from the id if not set in props');
  });

  describe('.clone()', function () {
    it(`preserves the ID of the variant`, function () {
      const variant = makeVariant();
      const cloned = variant.clone();
      expect(variant.id).to.equal(cloned.id);
    });
  });

  describe('.isVariant()', function () {
    it('returns true if item is a Variant and false otherwise', function () {
      const variant = makeVariant();
      expect(Variant.isVariant(variant)).to.be.true;
      expect(Variant.isVariant({})).to.be.false;
    });
  });
  describe('.[Symbol.toStringTag]', function () {
    const variant = makeVariant();
    expect(variant[Symbol.toStringTag]).to.equal('Variant');
  });
});
