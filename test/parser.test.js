/* eslint no-unused-expressions : "off", handle-callback-err: "off", new-cap: "off" */

const Parser = require('@frctl/internals').Parser;
const Stack = require('@frctl/internals').Stack;
const fs = require('@frctl/ffs');
const expect = require('@frctl/utils/test').expect;
const parser = require('../src/parser');

const cwd = '/path/to';
const base = '/path/to/base';

const files = [
  'collection/_01-@another-component',
  'collection/@component',
  'collection/@component/file.js',
  'collection/@component/config.js',
  'collection',
  'collection/config.js',
  'collection/random.txt',
  'assets',
  'assets/global.css'
].map(path => fs.File({
  cwd, base,
  path: `${base}/${path}`,
  isDirectory: (path.indexOf('.') === -1)
}));

describe('parser()', function () {
  it(`returns a Parser instance`, function () {
    expect(parser()).to.be.instanceof(Parser);
  });

  it(`has stacks for files, components and collections registered`, function () {
    const ps = parser();
    for (const stack of ['files', 'components', 'collections']) {
      expect(ps.getStack(stack)).to.be.instanceof(Stack);
    }
  });

  it(`identifies components`, function (done) {
    const ps = parser();
    ps.process(files, function (err, result) {
      expect(result.components.length).to.equal(2);
      done();
    });
  });

  it(`identifies collections`, function (done) {
    const ps = parser();
    ps.process(files, function (err, result) {
      expect(result.collections.length).to.equal(1);
      done();
    });
  });

  it(`identifies files`, function (done) {
    const ps = parser();
    ps.process(files, function (err, result) {
      expect(result.files.length).to.equal(5);
      done();
    });
  });

  it(`sets a '.role' property on all files`, function (done) {
    const ps = parser();
    ps.process(files, function (err, result) {
      for (const file of result.files) {
        expect(file).to.have.property('role');
      }
      done();
    });
  });

  it(`sets a '.scope' property on all files`, function (done) {
    const ps = parser();
    ps.process(files, function (err, result) {
      for (const file of result.files) {
        expect(file).to.have.property('scope');
      }
      done();
    });
  });
});
