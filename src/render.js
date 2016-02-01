'use strict';

const Promise     = require('bluebird');
const nunjucks    = require('nunjucks');
const _           = require('lodash');
const highlighter = require('./highlighter');
const Component   = require('./components/component');
const Variant     = require('./components/variant');
const Page        = require('./pages/page');
const render      = require('./components/render');
const context     = require('./components/context');
const status      = require('./components/status');
const source      = require('./source');
const config      = require('./config');

const NullLoader = nunjucks.Loader.extend({
    getSource: name => {}
});

module.exports = function render(includePath, config) {

    config = config || {};

    const loader = includePath ? new nunjucks.FileSystemLoader(includePath, {
        watch: false,
        noCache: true
    }) : new NullLoader();

    const env = Promise.promisifyAll(new nunjucks.Environment(loader, {
        autoescape: false,
        noCache: true
    }));

    // Add configured
    _.each(_.defaults(config.globals || {}),    (val, key) => env.addGlobal(key, val));
    _.each(_.defaults(config.extensions || {}), (val, key) => env.addExtension(key, val));
    _.each(_.defaults(config.filters || {}),    (val, key) => {
        return _.isFunction(val) ? env.addFilter(key, val) : env.addFilter(key, val.filter, val.async || false);
    });

    env.addFilter('context', (entity, cb) => {
        let ctx;
        if (entity instanceof Component || entity instanceof Variant) {
            ctx = context(entity.context);
        } else if (entity instanceof Page) {
            ctx = Promise.resolve(entity.context);
        } else {
            ctx = Promise.resolve(entity);
        }
        ctx.then(result => cb(null, result)).catch(cb);
    }, true);

    env.addFilter('render', (entity, cb) => {
        render(entity).then(result => cb(null, result)).catch(cb);
    }, true);

    env.addFilter('async', (p, cb) => {
        Promise.resolve(p).then(result => cb(null, result)).catch(cb);
    }, true);

    env.addFilter('stringify', (obj) => {
        return JSON.stringify(obj, null, 4);
    });

    env.addFilter('highlight', highlighter);

    env.addExtension('ErrorExtension', new ErrorExtension());

    return function (str, ctx) {
        return Promise.props(getFractalGlobals()).then(frctl => {
            let context = ctx || {};
            context.frctl = frctl;
            return env.renderStringAsync(str, context);
        });
    };
};

function ErrorExtension() {
    this.tags = ['error'];
    this.parse = function (parser, nodes, lexer) {
        var tok = parser.nextToken();
        var errorType = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtension(this, 'run', errorType);
    };
    this.run = function (context, errorType) {
        if (errorType == '404') {
            throw new NotFoundError('Not Found');
        } else {
            throw new Error('Server error');
        }
    };
}

function getFractalGlobals() {
    return {
        components: source('components'),
        pages: source('pages'),
        status: status,
        config: config.get(),
    };
}
