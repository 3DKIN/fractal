const isBuffer = require('buffer').Buffer.isBuffer;
const {assert} = require('check-types');
const cloneStats = require('clone-stats');
const cloneBuffer = require('clone-buffer');
const fromParse5 = require('hast-util-from-parse5');
const toHTML = require('hast-util-to-html');
const Parser5 = require('parse5/lib/parser');
const {cloneDeep} = require('@frctl/utils');
const schema = require('../../schema');
const File = require('./file');

const parser = new Parser5({locationInfo: true});
const parseCache = {};
const stringifyCache = {};

const managedProps = [];

class Template extends File {

  constructor(props) {
    if (Template.isTemplate(props)) {
      return props;
    }
    super(props);
  }

  get contents() {
    if (!this._contents) {
      return '';
    }
    const key = JSON.stringify(this._contents);
    if (!stringifyCache[key]) {
      stringifyCache[key] = toHTML(this._contents, {
        allowDangerousHTML: true,
        allowDangerousCharacters: true
      });
    }
    return stringifyCache[key];
  }

  set contents(str) {
    if (!isBuffer(str) && typeof str !== 'string') {
      throw new TypeError('Template.contents must be a Buffer or a string [invalid-contents]');
    }
    str = String(str);
    if (!parseCache[str]) {
      const parsed = /<html/i.test(str) ? parser.parse(str) : parser.parseFragment(str);
      parseCache[str] = fromParse5(parsed, {file: str});
    }
    this._contents = parseCache[str];
  }

  transform(fn) {
    assert.function(fn, `Template.transform - transformer must be a function [transformer-invalid]`);
    const contents = cloneDeep(this._contents);
    fn(contents);
    this._contents = contents;
    return this;
  }

  toFile(file) {
    return new File(Object.assign({}, this.getProps(), {
      stat: (this.stat ? cloneStats(this.stat) : null),
      contents: Buffer.from(this.contents)
    }));
  }

  static fromFile(file) {
    file = File.isFile(file) ? file : new File(file);
    return new Template(Object.assign({}, file.getProps(), {
      stat: (file.stat ? cloneStats(file.stat) : null),
      contents: Buffer.isBuffer(file.contents) ? cloneBuffer(file.contents) : file.contents
    }));
  }

  static isTemplate(item) {
    return item instanceof Template;
  }

  static isCustomProp(name) {
    return super.isCustomProp(name) && !managedProps.includes(name);
  }

  get [Symbol.toStringTag]() {
    return 'Template';
  }

}

Template.schema = schema.template;
managedProps.forEach(prop => Object.defineProperty(Template.prototype, prop, {enumerable: true}));

module.exports = Template;
