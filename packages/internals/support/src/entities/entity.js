const {isPlainObject, mapValues, pickBy, get, set, unset} = require('lodash');
const {cloneDeep, hash} = require('@frctl/utils');

class Entity {

  constructor(props) {
    Object.assign(this, props);
  }

  toJSON() {
    const props = pickBy(this, (item, key) => {
      return !key.startsWith('_');
    });
    return mapValues(props, (item, key) => {
      if (Buffer.isBuffer(item)) {
        return item.toString();
      }
      if (typeof item.toJSON === 'function') {
        return item.toJSON();
      }
      return item;
    });
  }

  clone() {
    const cloned = new this.constructor();
    Object.keys(this).forEach(key => {
      if (this[key] && typeof this[key].clone === 'function') {
        cloned[key] = this[key].clone();
        return;
      }
      if (typeof this[key] === 'function') {
        cloned[key] = this[key].bind(cloned);
        return;
      }
      if (isPlainObject(this[key])) {
        cloned[key] = cloneDeep(this[key]);
        return;
      }
      cloned[key] = this[key];
    });
    return cloned;
  }

  hash() {
    const hashProps = mapValues(this, (item, key) => {
      return (typeof item.hash === 'function') ? item.hash() : item;
    });
    return hash(JSON.stringify(hashProps));
  }

  get [Symbol.toStringTag]() {
    return 'Entity';
  }

  static from(props) {
    return new this(props);
  }
}

module.exports = Entity;
