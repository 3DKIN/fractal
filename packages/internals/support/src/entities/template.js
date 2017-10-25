const {extname} = require('path');
const {assert} = require('check-types');
const fromParse5 = require('hast-util-from-parse5');
const toHTML = require('hast-util-to-html');
const Parser5 = require('parse5/lib/parser');
const schema = require('../../schema');
const Validator = require('../validator');
const Entity = require('./entity');

const parser = new Parser5({locationInfo: true});
const managedProps = ['extname'];

class Template extends Entity {

  constructor(props = {}) {
    assert.object(props, 'Template.constructor - props must be an object [properties-invalid]');
    if (typeof props.contents === 'string') {
      // TODO: cache template parsing
      props.contents = fromParse5(parser.parseFragment(props.contents), {file: props.contents});
    }
    super(props);
    this.defineGetter('extname', () => extname(this.get('filename')));
  }

  toString() {
    return toHTML(this.get('contents'));
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      contents: this.toString()
    });
  }

  static isTemplate(item) {
    return item instanceof Template;
  }

  get [Symbol.toStringTag]() {
    return 'Template';
  }

  static isCustomProp(name) {
    return super.isCustomProp(name) && !managedProps.includes(name);
  }

  static validate(props) {
    Validator.assertValid(props, schema.template, `Template.constructor: The properties provided do not match the schema of a template [properties-invalid]`);
  }

  static from(props = {}) {
    return new Template(props);
  }

  _validateOrThrow(props) {
    Template.validate(props);
  }

}

module.exports = Template;
