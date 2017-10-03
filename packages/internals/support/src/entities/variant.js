const {omit} = require('lodash');
const fromParse5 = require('hast-util-from-parse5');
const Parser5 = require('parse5/lib/parser');
const Validator = require('../validator');
const schema = require('../../schema');
const Collection = require('../collections/collection');
const Entity = require('./entity');
const Template = require('./template');

const parser = new Parser5({locationInfo: true});

const _templates = new WeakMap();
const _componentId = new WeakMap();

const reservedConfigProps = [
  'component',
  'opts',
  'files',
  'views',
  'previews',
  'scenarios',
  'templates'
];

class Variant extends Entity {

  constructor(props) {
    if (Variant.isVariant(props)) {
      return props;
    }
    const entityProps = omit(props, reservedConfigProps);

    super(entityProps);
    this._validateOrThrow(props);

    this._setTemplates(props.templates);
    this._setComponentId(props.component);

    for (const prop of reservedConfigProps) {
      this.defineSetter(prop, () => {
        throw new Error(`The ${prop} property is a reserved property and cannot be written to directly [reserved-prop]`);
      });
    }
  }

  getComponentId() {
    return _componentId.get(this);
  }

  getTemplate(finder) {
    if (!finder) {
      return this.getTemplates().first();
    }
    if (typeof finder === 'string') {
      return this.getTemplates().find(tpl => tpl.extname === finder);
    }
    return this.getTemplates().find(finder);
  }

  getTemplates() {
    return new Collection(_templates.get(this));
  }

  addTemplate(contents, filename) {
    // TODO: cache template parsing
    const tree = fromParse5(parser.parseFragment(contents), {
      file: contents
    });
    const template = new Template(tree, filename);
    _templates.get(this).push(template);
    return this;
  }

  addTemplates(templates = {}) {
    for (const filename of Object.keys(templates)) {
      this.addTemplate(templates[filename], filename);
    }
    return this;
  }

  _setComponentId(componentId) {
    _componentId.set(this, componentId);
  }

  _setTemplates(templates) {
    if (Collection.isCollection(templates)) {
      _templates.set(this, templates.toArray());
    } else {
      _templates.set(this, []);
      this.addTemplates(templates);
    }
  }

  _validateOrThrow(props) {
    Validator.assertValid(props, schema.variant, `Variant.constructor: The properties provided do not match the schema of a variant [properties-invalid]`);
  }

  clone() {
    return new this.constructor({
      id: this.get('id'),
      component: this.getComponentId(),
      props: this.getData(),
      templates: this.getTemplates().clone()
    });
  }

  toJSON() {
    return {
      id: this.get('id'),
      componentId: this.getComponentId(),
      props: super.toJSON(),
      templates: this.getTemplates().toJSON()
    };
  }

  static isVariant(item) {
    return item instanceof Variant;
  }

  get [Symbol.toStringTag]() {
    return 'Variant';
  }

}

module.exports = Variant;
