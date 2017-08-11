const {ExtendedConfig} = require('@frctl/config');
const schema = require('./schema');

const addOns = ['commands', 'plugins', 'extensions', 'adapters'];

const accessors = addOns.map(prop => ({
  path: prop,
  handler: 'packages-loader'
}));

function defaultsCustomizer(targetValue, defaultValue, key) {
  if (addOns.includes(key)) {
    targetValue = typeof targetValue === 'undefined' ? [] : targetValue;
    defaultValue = typeof defaultValue === 'undefined' ? [] : defaultValue;
    if (Array.isArray(targetValue) && Array.isArray(defaultValue)) {
      return [...defaultValue, ...targetValue];
    }
  }
}

module.exports = function configFactory(data) {
  return new ExtendedConfig(data, {
    schema,
    accessors,
    customizers: {
      defaults: defaultsCustomizer
    }
  });
};

module.exports.accessors = accessors;
module.exports.defaultsCustomizer = defaultsCustomizer;
