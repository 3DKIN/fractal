const multimatch = require('multimatch');
const check = require('check-types');
const slash = require('slash');
const File = require('../entities/file');
const Collection = require('./collection');

const assert = check.assert;

class FileCollection extends Collection {

  find(...args) {
    if (args.length === 1 && typeof args[0] === 'string') {
      return super.find('relative', args[0]);
    }
    return super.find(...args);
  }

  filterByPath(...args) {
    let paths = [].concat(...args);
    assert.array.of.string(paths, `FileCollection.filterByPath: path argument must be a string or array of strings [paths-invalid]`);
    paths = paths.map(path => slash(path));

    const items = this._items.filter(file => {
      return multimatch([slash(file.relative)], paths).length;
    });

    return new FileCollection(items);
  }

  rejectByPath(...args) {
    let paths = [].concat(...args);
    assert.array.of.string(paths, `ComponentCollection.rejectByPath: path argument must be a string or array of strings [paths-invalid]`);
    paths = paths.map(path => slash(path));

    const items = this._items.filter(file => {
      return !multimatch([slash(file.relative)], paths).length;
    });

    return new FileCollection(items);
  }

  toJSON() {
    return this._items.map(file => file.toJSON());
  }

  validateOrThrow(items) {
    const isValid = FileCollection.validate(items);
    assert(isValid, `FileCollection.constructor: The 'items' argument is optional but must be an array of Files [items-invalid]`, TypeError);
    return isValid;
  }

  static validate(items) {
    return check.maybe.array.of.instance(items, File);
  }

  get [Symbol.toStringTag]() {
    return 'FileCollection';
  }

}
module.exports = FileCollection;
