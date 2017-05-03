const _ = require('lodash');
const check = require('check-types');
const fs = require('@frctl/ffs');

const assert = check.assert;

module.exports = {

  config(config) {
    assert.maybe.object(config, `Configuration must be supplied as an object [config-invalid]`);
  },

  src(src) {
    assert.string(src, `src must be an string [src-invalid]`);
  },

  file(file) {
    assert.instance(file, fs.File, `file is not a valid File object [file-invalid]`);
  },

  plugin(plugin) {
    assert.function(plugin, `Plugins must be functions [plugin-invalid]`);
  },

  extension(extension) {
    assert.function(extension, `Extensions must be functions [extension-invalid]`);
  },

  method(method) {
    validateObj('method', method, {
      name: 'string',
      handler: 'function'
    });
  },

  command(command) {
    validateObj('command', command, {
      command: 'string',
      description: 'string',
      handler: 'function'
    });
  },

  transform(transform) {
    validateObj('transform', transform, {
      name: 'string',
      transformer: 'function'
    });
  },

  callback(callback) {
    assert.function(callback, `callback must be a function [callback-invalid]`);
  }

};

function validateObj(what, obj, props = {}) {
  assert.object(obj, `${what} must be an object [${what}-invalid]`);
  const propNames = _.keys(props);
  for (const prop of propNames) {
    if (typeof obj[prop] === 'undefined') {
      throw new TypeError(`${what}s must be objects with props '${propNames.join(', ')}' [${what}-invalid]`);
    }
  }
  _.forEach(props, (type, prop) => {
    if (Array.isArray(type)) {
      for (const test of type) {
        if (check[test](obj[prop])) {
          return;
        }
      }
      throw new TypeError(`${what} must be one of ${type.join(', ')} [${what}-${prop}-invalid]`);
    }
    assert[type](obj[prop], `${what} must be a ${type} [${what}-${prop}-invalid]`);
  });
}
