const {expect} = require('../../../test/helpers');
const main = require('./index');

const srcExports = {
  Collection: require('./src/collections/collection'),
  ComponentCollection: require('./src/collections/component-collection'),
  FileCollection: require('./src/collections/file-collection'),
  Entity: require('./src/entities/entity'),
  File: require('./src/entities/file'),
  Component: require('./src/entities/component'),
  Variant: require('./src/entities/variant'),
  Command: require('./src/add-ons/command'),
  Adapter: require('./src/add-ons/adapter'),
  Preset: require('./src/add-ons/preset'),
  Emitter: require('./src/emitter'),
  EmittingPromise: require('./src/emitting-promise'),
  Validator: require('./src/validator')
};

describe('Support exports', function () {
  it('exports all support classes', function () {
    Object.keys(main).forEach(key => {
      expect(main[key]).to.equal(srcExports[key]);
    });
  });
});
