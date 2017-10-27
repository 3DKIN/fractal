const {relative} = require('path');
const {normalizeId, uniqueId, cloneDeep, titlize, slugify} = require('@frctl/utils');
const check = require('check-types');
const Validator = require('../validator');
const schema = require('../../schema');
const VariantCollection = require('../collections/variant-collection');
const FileCollection = require('../collections/file-collection');
const EntityCollection = require('../collections/entity-collection');
const Entity = require('./entity');
const File = require('./file');
const Variant = require('./variant');

const assert = check.assert;
const managedProps = ['label', 'files', 'variants', 'relative', 'config'];

class Component extends Entity {

  constructor(props) {
    if (Component.isComponent(props)) {
      return props;
    }

    assert.object(props, 'Component.constructor - props must be an object [properties-invalid]');

    props.files = props.files || new FileCollection();
    props.variants = props.variants || new VariantCollection();
    props.config = props.config || {};

    super(props);

    this.defineGetter('label', value => {
      return value || this.getConfig('label') || titlize(this.get('id'));
    });

    this.defineGetter('config', value => cloneDeep(value || {}));

    this.defineGetter('relative', (value, entity) => {
      return relative(this.get('base'), this.get('path'));
    });

    this.defineSetter('relative', (value, entity) => {
      throw new TypeError('Component.relative is generated from the base and path attributes. Do not modify it [invalid-set-relative]');
    });

    this.defineSetter('files', value => {
      if (!FileCollection.isCollection(value)) {
        throw new Error(`Component.files must be a FileCollection instance`);
      }
      return value;
    });

    this.defineSetter('variants', value => {
      if (!EntityCollection.isCollection(value)) {
        throw new Error(`Component.variants must be a EntityCollection instance`);
      }
      return value;
    });
  }

  getFiles() {
    return this.get('files');
  }

  addFile(file) {
    file = File.isFile(file) ? file.clone() : new File(file);
    file.base = this.get('path');
    this.set('files', this.getFiles().push(file));
    return this;
  }

  getVariants() {
    return this.get('variants');
  }

  getVariant(id) {
    return this.getVariants().find(id);
  }

  getVariantOrDefault(id) {
    return this.getVariants().find(id) || this.getDefaultVariant();
  }

  addVariant(props) {
    if (Variant.isVariant(props)) {
      this.set('variants', this.getVariants().push(props));
      return this;
    }

    assert.object(props, `Component.addVariant: The 'props' argument must be a variant config object or Variant instance [props-invalid]`);

    const variantIds = this.getVariants().mapToArray(v => v.id);
    const views = this.getViews().filter(view => view.contents);

    props = cloneDeep(props);
    props.id = uniqueId(slugify(props.id || props.label || 'variant'), variantIds);

    this.set('variants', this.getVariants().push(Variant.from({config: props, views})));
    return this;
  }

  getDefaultVariant() {
    return this.getConfig('default') ? this.getVariants().find(this.getConfig('default')) : this.getVariants().first();
  }

  getViews() {
    const viewMatcher = this.getConfig('views.match', () => false); // default to no matches
    const viewSorter = view => (view.extname === this.getConfig('views.default')) ? 0 : 1;
    return this.getFiles().filter(viewMatcher).sortBy(viewSorter);
  }

  getView(...args) {
    return args ? this.getViews().find(...args) : this.views.first();
  }

  getConfig(path, fallback) {
    if (path) {
      return this.get(`config.${path}`, fallback);
    }
    return this.get('config');
  }

  toJSON() {
    const defaultVariant = this.getDefaultVariant();
    const json = super.toJSON();
    return Object.assign(json, {
      variants: json.variants.map(variant => {
        if (variant.id === defaultVariant.id) {
          variant.default = true;
        }
        return variant;
      })
    });
  }

  get [Symbol.toStringTag]() {
    return 'Component';
  }

  static validate(props) {
    Validator.assertValid(props, schema.component, `Component.constructor: The properties provided do not match the schema of a component [properties-invalid]`);
  }

  _validateOrThrow(props) {
    return Component.validate(props);
  }

  static isComponent(item) {
    return item instanceof Component;
  }

  static isCustomProp(name) {
    return super.isCustomProp(name) && !managedProps.includes(name);
  }

  static from(props = {}) {
    const {src, files = [], config = {}} = props;
    if (!File.isFile(src)) {
      throw new TypeError(`Component.from - props.src must be a file instance [properties-invalid]`);
    }
    const component = new Component({
      id: normalizeId(config.id || src.stem),
      path: src.path,
      base: src.base,
      config
    });

    files.forEach(file => component.addFile(file));

    const variants = config.variants || [];
    if (Array.isArray(variants)) {
      if (variants.length === 0) {
        variants.push({id: 'default'});
      }
      variants.forEach(variant => component.addVariant(variant));
    }

    return component;
  }

}

module.exports = Component;
