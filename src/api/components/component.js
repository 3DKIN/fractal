'use strict';

const _                 = require('lodash');
const Entity            = require('../../core/entities/entity');
const VariantCollection = require('../variants/collection');

module.exports = class Component extends Entity {

    constructor(config, files, assets, parent){
        super(config.name, config, parent);
        this.isComponent   = true;
        this.defaultName   = config.default ? utils.slugify(config.default.toLowerCase()) : 'default';
        this.notes         = config.notes || null;
        this.notesFromFile = config.notesFromFile || false;
        this.lang          = files.view.lang.name;
        this.editorMode    = files.view.lang.mode;
        this.editorScope   = files.view.lang.scope;
        this.viewPath      = files.view.path;
        this._assets       = assets;
        this._variants     = new VariantCollection({ name: `${this.name}-variants` }, [], parent);
    }

    _handle(config) {
        return this.parent.getProp('prefix') ? `${this.parent.getProp('prefix')}-${config.name}` : config.name;
    }

    get isCollated() {
        return this.collated;
    }

    get content() {
        return this.variants().default().getContentSync();
    }

    render(context, preview, collate) {
        return this.source.render(this, context, {
            preview: preview,
            collate: collate
        });
    }

    setVariants(variantCollection) {
        this._variants = variantCollection;
    }

    hasTag(tag) {
        return _.includes(this.tags, tag);
    }

    assets() {
        return this._assets;
    }

    flatten() {
        return this.variants();
    }

    variants() {
        return this._variants;
    }

    toJSON(){
        const self       = super.toJSON();
        self.isComponent = true;
        self.notes       = this.notes;
        self.tags        = this.tags;
        self.isCollated  = this.isCollated;
        self.preview     = this.preview;
        self.display     = this.display;
        self.viewPath    = this.viewPath;
        self.variants = this.variants().toJSON();
        return self;
    }

    static *create(config, files, assets, parent) {
        config.notes = config.notes || config.readme;
        if (!config.notes && files.readme || config.notesFromFile && files.readme) {
            config.notesFromFile = true;
            config.notes = yield files.readme.read();
        }
        const comp = new Component(config, files, assets, parent);
        const variants = yield VariantCollection.create(comp, files.view, config.variants, files.varViews, config);
        comp.setVariants(variants);
        return comp;
    }

}
