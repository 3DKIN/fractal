/**
 * Module dependencies.
 */

var Promise     = require('bluebird');
var _           = require('lodash');
var path        = require('path');
var fs          = require('fs');
var crypto      = require('crypto');

var mixin       = require('./entity');
var utils       = require('../utils');
var md          = require('../markdown');
var renderer    = require('../handlers/components');
var app         = require('../application');

var resolvedContextCache = {};

/*
 * Export the variant.
 */

module.exports = Variant;

/*
 * Variant constructor.
 *
 * @api private
 */

function Variant(handle, config, parent){

    if (_.isUndefined(handle)) {
        throw new Error('No handle defined for variant of ' + parent.handle);
    }

    var self                = this;
    var context             = null;

    this._config            = config;
    this._files             = config.files || [];
    this._component         = parent;
    this._source            = parent._source;

    this.type               = 'variant';
    this.handle             = handle;
    this.fullHandle         = '@' + parent.handle + ':' + this.handle;
    this.label              = config.label || utils.titlize(handle);
    this.title              = config.title || this.label;
    this.handlePath         = parent.handlePath + '--' + this.handle;
    this.context            = config.context || {};
    this.display            = config.display || {};
    this.hidden             = config.hidden || false;
    this.status             = app.getStatus(config.status);
    this.preview            = config.preview || null;
    this.notes              = config.notes ? md(config.notes) : null;
    this.ext                = parent.viewExt;
    this.view               = path.parse(config.view).name + this.ext;
    this.engine             = parent.engine;

    if (parent.sourceType == 'directory') {
        this.fsViewPath = path.resolve(path.join(app.get('components:path'), parent._source.path, this.view));
    } else {
        this.fsViewPath = path.resolve(path.join(app.get('components:path'), parent._source.relativeDir, this.view));
    }

    this.contextString      = null;
    this.rendered           = null;
    this.renderedInLayout   = null;
    this._resolvedContext   = null;

    this.files = {
        view: _.find(this._files, 'fsBase', this.view),
        other: _.reject(this._files, 'fsBase', this.view),
    };

    try {
        var stats = fs.lstatSync(this.fsViewPath);
    } catch (e) {
        throw new Error('Variant view not found (path searched: ' + this.fsViewPath + ')');
    }

};

mixin.call(Variant.prototype);

/*
 * Initialise the variant with for anything not set in the constructor
 *
 * @api public
 */

Variant.prototype.init = function(siblings){
    var self = this;
    return self;
};

/*
 * Generate the rendered variant view.
 * Returns a Promise object.
 *
 * @api public
 */

Variant.prototype.renderView = function(context, preview){
    var self = this;
    var context = resolveContextReferences(context || self.context);
    return context.then(function(context){
        return preview ? renderer.renderPreview(self, context) : renderer.render(self, context);
    });
};

/*
 * Get a list of supporting files.
 *
 * @api public
 */

Variant.prototype.preRender = function(){
    var self = this;
    var rendered = this.renderView(null, false);
    var renderedPreview = this.renderView(null, true);
    var contextString = this.getContextString();
    return Promise.join(rendered, renderedPreview, contextString, function(rendered, renderedPreview, contextString){
        self.rendered = rendered;
        self.renderedPreview = renderedPreview;
        self.contextString = contextString;
        return self;
    });
};

/*
 * Get a list of supporting files.
 *
 * @api public
 */

Variant.prototype.getFiles = function(){
    return this._files;
};

/*
 * Get a file object for one of the variant's support files.
 *
 * @api public
 */

Variant.prototype.getFile = function(baseName){
    var file = _.find(this.getFiles(), 'base', baseName);
    if (!file) {
        throw new Error('File ' + baseName + ' not found for variant ' + this.handle);
    }
    return file;
};

/*
 * Get a stringified version of the variant's context
 *
 * @api public
 */

Variant.prototype.getContextString = function(){
    if (_.isEmpty(this.context)) {
        return Promise.resolve(null);
    }
    return this.getResolvedContext().then(function(c){
        return JSON.stringify(c, null, 4);
    });
};

Variant.prototype.getResolvedContext = function(){
    return resolveContextReferences(this.context);
};

/*
 * Takes a context object and resolves any references to other variants,
 * as well as resolving any promises.
 *
 * @api public
 */

function resolveContextReferences(context) {
    var key = crypto.createHash('md5').update(JSON.stringify(context)).digest("hex");
    if (!resolvedContextCache[key]) {
        resolvedContextCache[key] = app.getComponents().then(function(components){
            function resolve(obj) {
                var iterator = _.isArray(obj) ? 'map' : 'mapValues';
                var handler  = _.isArray(obj) ? 'all' : 'props';
                var promises = _[iterator](obj, function(val, key){
                    return Promise.resolve(val).then(function(val){
                        if (_.isObject(val) || _.isArray(val)) {
                            return resolve(val);
                        }
                        if (_.startsWith(val, '@')) {
                            var parts = val.split('.');
                            var handle = parts.shift();
                            var entity = components.resolve(handle);
                            if (entity) {
                                if (entity.type == 'component') {
                                    entity = entity.getVariant();
                                }
                                if (parts.length) {
                                    var dotPath = parts.join('.');
                                    return entity.getResolvedContext().then(function(c){
                                        return _.get(c, dotPath, null);
                                    });
                                }
                                return entity.getResolvedContext();
                            } else {
                                logger.warn("Could not resolve data reference for " + val);
                            }
                        }
                        return val;
                    });
                });
                return Promise[handler](promises);
            }
            return Promise.resolve(context).then(function(context){
                return resolve(context);
            });
        });
    }
    return resolvedContextCache[key];
}
