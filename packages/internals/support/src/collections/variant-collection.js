const {uniqueName, cloneDeep} = require('@frctl/utils');
const check = require('check-types');
const Variant = require('../entities/variant');
const EntityCollection = require('./entity-collection');

const assert = check.assert;

const _variantNames = new WeakMap();
const _componentId = new WeakMap();

class VariantCollection extends EntityCollection {

  constructor(items = [], componentId = '') {
    super([]);

    _componentId.set(this, componentId);
    _variantNames.set(this, []);

    items = this._normaliseItems(items);
    if (items) {
      try {
        items = this._castItems(items);
      } catch (err) {
        if (err instanceof TypeError) {
          assert(
            false,
            `VariantCollection.constructor: The 'items' argument is optional but must be an array of Variants or pre-Variant objects [items-invalid]`,
            TypeError
          );
        } else {
          throw err;
        }
      }
    }
    this._validateOrThrow(items);
    this._items = items;
  }

  getDefault() {
    let defaultItem;
    let variants = this._items;
    if (variants.length > 0) {
      const defaultDefined = variants.filter(v => v.default === true).reduceRight((acc, current) => current, undefined);
      defaultItem = defaultDefined ? defaultDefined : variants[0];
    }
    return defaultItem;
  }

  hasDefault() {
    if (this._items.length > 0) {
      return true;
    }
    return false;
  }

  createVariant(props = {}) {
    const isValidVariant = check.maybe.instance(props, Variant);
    const isValidProp = check.maybe.object(props);
    assert(
      (isValidProp || isValidVariant),
      `VariantCollection.constructor: The 'items' argument is optional but must be an array of objects or Variants [items-invalid]`,
      TypeError
    );
    props = Object.assign({}, props, {
      component: _componentId.get(this),
      name: uniqueName(props.name || 'variant', _variantNames.get(this))
    });

    return Variant.from(props);
  }

  //
  // Overridden methods
  //

  push(item) {
    const items = this.items;
    items.push(item);
    return this._new(items, _componentId.get(this));
  }

  /*
   * find('name')
   * find('prop', value)
   * find({prop: value})
   * find(fn)
   */
  find(...args) {
    if (args.length === 1 && typeof args[0] === 'string') {
      return super.find('name', args[0]);
    }
    return super.find(...args);
  }

  clone() {
    const items = this.toArray().map(item => {
      if (typeof item.clone === 'function') {
        return item.clone();
      }
      return cloneDeep(item);
    });
    return this._new(items, _componentId.get(this));
  }

  _castItems(items) {
    return items.map(i => this.createVariant(i));
  }

  _validateOrThrow(items) {
    const isValid = VariantCollection.validate(items);
    assert(
      isValid,
      `VariantCollection.constructor: The 'items' argument is optional but must be an array of Variants [items-invalid]`,
      TypeError
    );
    return isValid;
  }

  get [Symbol.toStringTag]() {
    return 'VariantCollection';
  }

  static validate(items) {
    return check.maybe.array.of.instance(items, Variant);
  }
}

module.exports = VariantCollection;
