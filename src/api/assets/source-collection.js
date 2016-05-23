'use strict';

const _            = require('lodash')
const anymatch     = require('anymatch');
const Promise      = require('bluebird');

const utils        = require('../../core/utils');
const Log          = require('../../core/log');
const mix          = require('../../core/mixins/mix');
const Configurable = require('../../core/mixins/configurable');
const Collection   = require('../../core/mixins/collection');
const Emitter      = require('../../core/mixins/emitter');
const Source       = require('./source');

module.exports = class AssetSourceCollection extends mix(Configurable, Collection, Emitter) {

    constructor(app){
        super('assets', app);
        this.name = 'assets';
        this._app = app;
        this.config(app.get(this.name));
    }

    get label() {
        return this.get('label') || utils.titlize(this.name);
    }

    get title() {
        return this.get('title') || this.label;
    }

    src(path, config) {
        config = config || {};
        config = _.defaults(config, {
            match: '*',
            name: utils.slugify(path).replace('/','-'),
            path: path
        });
        let source = new Source(config.name, config, this._app);
        this._items.add(source);
        return source;
    }

    remove(name) {
        for (let item of this.items()) {
            if (item.name === name) {
                this.removeItem(item);
            }
        }
        return this;
    }

    getSrc(name) {
        if (arguments.length === 1) {
            for (let item of this.items()) {
                if (item.name === name) {
                    return item;
                }
            }
            throw new Error(`Asset source '${name}' not found`);
        }
    }

    sources() {
        return this.toArray();
    }

    list() {
        return this.items().toArray().map(i => i.name);
    }

    watch() {
        this.sources().forEach(s => s.watch());
        return this;
    }

    unwatch() {
        this.sources().forEach(s => s.unwatch());
        return this;
    }

    load() {
        return Promise.all(this.sources().map(s => s.load()));
    }

    toJSON() {
        const self        = super.toJSON();
        self.name         = this.name;
        self.label        = this.label;
        self.title        = this.title;
        self.isCollection = true;
        self.items        = this.toArray().map(i => (i.toJSON ? i.toJSON() : i));
        return self;
    }

};
