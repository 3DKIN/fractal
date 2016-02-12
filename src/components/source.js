'use strict';

const Promise   = require('bluebird');
const _         = require('lodash');
const co        = require('co');
const fs        = Promise.promisifyAll(require('fs'));
const anymatch  = require('anymatch');
const transform = require('./transform');
const logger    = require('../logger');
const Source    = require('../source');
const resolve   = require('../context');

module.exports = class ComponentSource extends Source {

    constructor(sourcePath, props, items) {
        super(sourcePath, props, items);
        this._status   = props.status.default;
        this._preview  = props.preview;
        this._display  = props.display;
        this.yield    = props.yield;
        this.splitter = props.splitter;
        this._statuses = props.status;
        this.transform = transform;
    }

    resolve(context) {
        return resolve(context, this);
    }

    renderPreview(entity, layout) {
        layout = layout !== false ? true : false;
        const variant = entity.getVariant();
        return this.render(variant, variant.context, layout);
    }

    renderString(str, context) {
        return engine.render(null, str, context);
    }

    render(entity, context, layout) {
        if (!entity) {
            return Promise.reject(null);
        }

        const self = this;
        const engine  = self.engine();

        if (_.isString(entity)) {
            return fs.readFileAsync(entity, 'utf8').then(function (content) {
                return engine.render(entity, content, context);
            });
        }

        const variant = entity.getVariant();
        const renderContext = context || variant.context;
        return co(function* () {
            const source   = yield (self.isLoaded ? Promise.resolve(self) : self.load());
            const context  = yield self.resolve(renderContext);
            const content  = yield variant.getContent(true);
            const rendered = yield engine.render(variant.viewPath, content, context);
            if (layout && variant.preview) {
                let layout = source.find(`@${variant.preview.replace('@', '')}`);
                if (!layout) {
                    logger.error(`Preview layout ${variant.preview} for component ${variant._parent.handle} not found.`);
                    return rendered;
                }
                layout = layout.getVariant();
                let layoutContext = yield source.resolve(layout.context);
                const layoutContent = yield layout.getContent(true);
                layoutContext._variant = variant.toJSON();
                layoutContext[self.yield] = rendered;
                return engine.render(layout.viewPath, layoutContent, layoutContext);
            }
            return rendered;
        });
    }

    statusInfo(handle) {
        if (_.isUndefined(handle) || (_.isArray(handle) && !handle.length)) {
            return null;
        }
        if (_.isArray(handle)) {
            const handles = _.uniq(handle);
            if (handles.length === 1) {
                return this.statusInfo(handles[0]);
            }
            const statuses = _.compact(handles.map(l => this.statusInfo(l)));
            const details = _.clone(this._statuses.mixed);
            details.statuses = statuses;
            return details;
        }
        if (handle == this._statuses.mixed.handle) {
            return this._statuses.mixed;
        }
        if (!this._statuses.options[handle]) {
            logger.error(`Status ${handle} is not a known option.`);
            return this._statuses.options[this._statuses.default];
        }
        return this._statuses.options[handle];
    }

    components() {
        return super.entities();
    }

    variants() {
        let items = [];
        for (let component of this.components()) {
            items = _.concat(items, component.variants());
        }
        return this.newSelf(items);
    }

    find() {
        if (this.size === 0 || arguments.length === 0) {
            return;
        }
        for (let item of this) {
            if (item.type === 'collection') {
                const search = item.find.apply(item, arguments);
                if (search) return search;
            } else if (item.type === 'component') {

                const matcher = this._makePredicate.apply(null, arguments);
                if (matcher(item)) return item;
                if (arguments.length == 1 && _.isString(arguments[0]) && arguments[0].startsWith('@')) {
                    let variant = item.getVariantByHandle(arguments[0].replace('@', ''));
                    if (variant) return variant;
                }
            }
        }
    }

    isView(file) {
        return anymatch([`**/*${this.ext}`, `!**/*${this.splitter}*${this.ext}`], file.path);
    }

    isVarView(file) {
        return anymatch(`**/*${this.splitter}*${this.ext}`, file.path);
    }

    isConfig(file) {
        return anymatch(`**/*.config.{js,json,yaml,yml}`, file.path);
    }

    isReadme(file) {
        return anymatch(`**/readme.md`, file.path);
    }

};
