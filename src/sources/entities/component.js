/**
 * Module dependencies.
 */

var Promise     = require('bluebird');
var _           = require('lodash');
var path        = require('path');
var logger      = require('winston');

var mixin       = require('./entity');
var Variant     = require('./variant');
var utils       = require('../../utils');
var data        = require('../../data');
var md          = require('../../markdown');

/*
 * Export the component.
 */

module.exports = Component;

/*
 * Component constructor.
 *
 * - Extract config from config file, if present.
 * - Build component metadata . 
 * - Instantiate and return new component.
 * 
 * @api private
 */

function Component(dir, app){
    var self = this;
    var variants = null;
    var configFile = _.find(dir.getFiles(), function(entity){
        return entity.matches(app.get('components:config'));
    });
    var config = configFile ? data.load(configFile) : {};

    this._app = app;
    this._dir = dir;

    this._configFile = configFile;
    this._config    = _.cloneDeep(config);
    this.type       = 'component';
    this.order      = dir.order;
    this.depth      = dir.depth;
    this.hidden     = !! (config.hidden || dir.hidden);
    this.fsPath     = dir.path;
    this.path       = utils.fauxPath(dir.path);
    this.handlePath = this.path;
    this.handle     = config.handle || utils.fauxPath(dir.name);
    this.fullHandle = '@' + this.handle;
    this.label      = config.label || utils.titlize(dir.name);
    this.title      = config.title || this.label;
    
    if (_.isUndefined(config.readme)) {
        var readMeFile = _.find(dir.getFiles(), function(entity){
            return entity.matches(app.get('components:readme'));
        });
        this.readme  = readMeFile ? md(readMeFile.getContents()) : null;
        this._readMeFile = readMeFile;
    } else {
        this.readme = config.readme || null;
        this._readMeFile = null;
    }

    // default variant
    var defaultVariantConfig = _.cloneDeep(config).default || {};
    var defaultVariantHandle = defaultVariantConfig.handle || 'default';
    this.default = new Variant(defaultVariantHandle, defaultVariantConfig, this);
    this.defaultVariant = defaultVariantHandle;

    Object.defineProperty(this, 'variants', {
        enumerable: true,
        get: function() {
            if (_.isNull(variants)) {
                variants = self.getVariants();
            }
            return variants;
        }
    });

    Object.defineProperty(this, 'status', {
        enumerable: true,
        get: this.getStatuses
    });
};

mixin.call(Component.prototype);

/*
 * Get an array of all the available variants.
 * Includes the base variant, so this will always have a length > 0.
 *
 * @api private
 */

Component.prototype.getVariants = function(){
    var self = this;
    var supplied = this._config.variants || [];
    var variants = [this.default];
    var usedViews = [];
    _.each(supplied, function(variant, i){
        try {
            var defaults = _.cloneDeep(self._config).default || {};
            // label, title and notes are not inherited from the default
            delete defaults.label;
            delete defaults.title;
            delete defaults.notes;
            var config = _.defaultsDeep(variant, defaults);
            var v = new Variant(variant.handle, config, self);
            variants.push(v);
            usedViews.push(v.view);
        } catch(e) {
            logger.error('Variant of ' + self.handle + ' could not be created: ' + e.message );
        }
    });
    // now find any view files that haven't been accounted for and turn them into variants
    // TODO: auto-create variants from unused view files
    // console.log('----');
    // console.log(usedViews);
    var initedVariants = _.map(variants, function(variant){
        return variant.init(variants);
    });
    return initedVariants;
};

/*
 * Get an object describing the specified variant.
 *
 * @api public
 */

Component.prototype.getVariant = function(handle){
    handle = handle || this.default.handle;
    var variant = _.find(this.variants, 'handle', handle);
    if (!variant) {
        throw new Error('The variant ' + handle + ' of component ' + this.handle + ' could not be found.');
    }
    return variant;
};

/*
 * Generate a rendered view of a variant.
 * Returns a Promise object.
 *
 * @api public
 */

Component.prototype.renderView = function(context, preview, handle){
    var variant = this.getVariant(handle);
    return variant.renderView(context, preview);
};

/*
 * Pre-render all variants.
 * Useful for running before .toJSON() to provide a one-hit promise-based rendering of variants.
 * Returns a promise of self. 
 *
 * @api public
 */

Component.prototype.renderAll = function(){
    var self = this;
    var promises = _.map(this.variants, function(variant){
        return variant.preRender();
    });
    return Promise.all(promises).then(function(){
        return self;
    });
};

/*
 * Get an array of files for a variant
 *
 * @api protected
 */

Component.prototype.getVariantFiles = function(variantName){
    var variant = this.getVariant(variantName);
    var dir = variant.cwd ? this._dir.findDirectory('path', variant.path) : this._dir;
    var files = [];
    if (dir) {
        files = dir.getFiles();
    }
    return files;
};

/*
 * Gets a de-duped array of the component variants statuses.
 *
 * @api public
 */

Component.prototype.getStatuses = function(){
    return _.compact(_.uniq(_.map(this.variants, function(variant){
            return variant.status;
    })));
};

/*
 * Create a new component from a directory
 *
 * @api public
 */

Component.fromDirectory = function(dir, config, app){
    return {
        toJSON: function(){
            return {
                type: "component",
                handle: dir.base
            }
        }
    };
};

/*
 * Create a new component from a file
 *
 * @api public
 */

Component.fromFile = function(file, dir, config, app){
    return {
        toJSON: function(){
            return {
                type: "component",
                handle: file.base
            }
        }
    };
};