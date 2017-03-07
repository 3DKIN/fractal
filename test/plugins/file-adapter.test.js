/* eslint no-unused-expressions : "off", handle-callback-err: "off" */
const expect = require('@frctl/utils/test').expect;
const adapterPluginFactory = require('./support/files').plugins.adapter;

const testUtils = require('./support/utils');

const testSignature = testUtils.testSignature;
const testPlugin = testUtils.testPlugin;
const testFactory = testUtils.testFactory;

describe(`'File adapter' plugin`, function () {
  describe('constructor', function () {
    it(`factory returns a function`, function () {
      testFactory(adapterPluginFactory);
    });

    it(`only accepts valid arguments`, function () {
      for (const type of [null, undefined]) {
        const fr = () => adapterPluginFactory(type);
        expect(fr).to.throw(TypeError, `[adapter-undefined]`);
      }
      for (const type of ['string', [], 123, {}]) {
        const fr = () => adapterPluginFactory(type);
        expect(fr).to.throw(TypeError, `[adapter-invalid]`);
      }
      for (const type of [{name: 'name', render: function () {}}]) {
        const fr = () => adapterPluginFactory(type);
        expect(fr).to.not.throw();
      }
    });
  });
  describe('instance method', function () {
    it(`has expected signature`, function () {
      testSignature('adapter');
    });

    it(`adds expected 'file.adapter' values with 'string' match value`, function (done) {
      const adapterPlugin = adapterPluginFactory({name: 'react', match: '.jsx', render: function () {}});

      const fileMocks = [{
        ext: '.jsx',
        role: 'view'
      },
      {
        ext: '.jsx',
        role: 'config'
      },
      {
        ext: '.js',
        role: 'view'
      }
      ];
      const fileExpected = [{
        ext: '.jsx',
        role: 'view',
        adapter: 'react'
      },
      {
        ext: '.jsx',
        role: 'config'
      },
      {
        ext: '.js',
        role: 'view'
      }
      ];
      testPlugin(adapterPlugin, fileMocks, fileExpected, done);
    });

    it(`adds expected 'file.adapter' values with 'function' match value`, function (done) {
      const adapterPlugin = adapterPluginFactory({name: 'nunjucks', match: file => file.ext === '.njk', render: function () {}});

      const fileMocks = [{
        ext: '.njk',
        role: 'view'
      },
      {
        ext: '.njk',
        role: 'config'
      },
      {
        ext: '.nj',
        role: 'view'
      }
      ];
      const fileExpected = [{
        ext: '.njk',
        role: 'view',
        adapter: 'nunjucks'
      },
      {
        ext: '.njk',
        role: 'config'
      },
      {
        ext: '.nj',
        role: 'view'
      }
      ];
      testPlugin(adapterPlugin, fileMocks, fileExpected, done);
    });
  });
});
