'use strict';

const _          = require('lodash');
const config     = require('../config');
const logger     = require('../logger');
const Collection = require('../collection');
const matcher    = require('../matchers');

module.exports = class PageCollection extends Collection {

    constructor(props, items) {
        super(props, items);
    }

    get context() {
        if (this._parent) {
            return _.defaultsDeep(this._context, this._parent.context);
        }
        return _.defaultsDeep(this._context, config.get('pages.context', {}));
    }

    static create(props, items) {
        return Promise.resolve(new PageCollection(props, items));
    }
};
