'use strict';

const Promise = require('bluebird');
const matter  = require('gray-matter');
const _       = require('lodash');
const utils   = require('../utils');
const config  = require('../config');

module.exports = class Page {

    constructor(props, content) {
        this.type     = 'page';
        this.name     = props.name.toLowerCase();
        this.handle   = props.handle || utils.slugify(props.name);
        this.ref      = `@${this.handle}`;
        this.order    = props.order;
        this.isHidden = props.isHidden;
        this.isIndex  = this.name === 'index';
        this.lang     = props.lang;
        this.label    = this.isIndex ? config.get('pages.indexLabel') : props.label || utils.titlize(props.name);
        this.title    = props.title || this.label;
        this._config  = props;
        this._raw     = content;
        this._buffer  = props.buffer;
        this._context = props.context || {};

        this._context.title = this._context.title || this.title;
        this._context.label = this._context.label || this.label;
    }

    get context(){
        return this._context;
    }

    get content(){
        return this._raw;
    }

    static create(props) {
        props.buffer = props.buffer || new Buffer();
        var parsed   = matter(props.buffer.toString('UTF-8'));
        props        = _.defaultsDeep(parsed.data || {}, props);
        return Promise.resolve(new Page(props, parsed.content));
    }

    toJSON() {
        return utils.toJSON(this);
    }
};
