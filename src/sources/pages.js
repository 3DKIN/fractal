/**
 * Module dependencies.
 */

var Promise     = require('bluebird');
var _           = require('lodash');
var logger      = require('winston');

var Directory   = require('../filesystem/directory');
var Page        = require('./entities/page');
var Group       = require('./entities/group');
var mixin       = require('./source');
var data        = require('../data');

/*
 * Export the page source.
 */

module.exports = PageSource;

/*
 * PageSource constructor.
 *
 * @api private
 */

function PageSource(pages, app){
    this.pages = pages;
    this.app = app;
};

mixin.call(PageSource.prototype);

/*
 * Return the page tree.
 *
 * @api public
 */

PageSource.prototype.all = function(){
    return this.pages;
};

/*
 * Resolve a page by handle or path and return the page.
 *
 * @api public
 */

PageSource.prototype.resolve = function(str){
    if (_.startsWith(str, '@')) {
        return this.findByHandle(str);
    } else {
        return this.findByPath(str);
    }
};

/*
 * Find a component by it's path.
 * If a the path specifies a variant then that will be returned in place of the component.
 * Throws an error if the component/variant is not found.
 *
 * Path format: my/page/path
 * 
 * @api public
 */

PageSource.prototype.findByPath = function(pagePath){
    var pathParts = pagePath.split('--', 2);
    return this.findByKey('path', pathParts[0]);
};

/*
 * Find a page by it's handle.
 * Throws an error if the page is not found.
 *
 * Handle format: @page-handle
 *
 * @api public
 */

PageSource.prototype.findByHandle = function(handle){
    handle = handle.replace(/^@/, '');
    var handleParts = handle.split(':', 2);
    return this.findByKey('handle', handleParts[0]);
};

/*
 * Find a page by a key.
 * Throws an error if the page is not found.
 *
 * @api public
 */

PageSource.prototype.findByKey = function(key, value) {
    var found = null;
    function checkChildren(children){
        if (found) return found;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.type === 'page' && _.get(child, key) === value) {
                found = child;
                break;
            } else if (child.type == 'group') {
                checkChildren(child.children);
            }
        };
        return found;
    }
    var result = checkChildren(this.pages);
    if (!result) {
        throw new Error('The page ' + key + ':' + value + ' could not be found.');
    }
    return result;
};

/*
 * Returns a JSON representation of all the pages
 *
 * @api public
 */

PageSource.prototype.toJSON = function(){
    return _.map(this.components, function(entity){
        return entity.toJSON();
    });
};

/*
 * Get a JSON-formatted string representation of the pages.
 *
 * @api public
 */
    
PageSource.prototype.toString = function(){
    return JSON.stringify(this.toJSON(), null, 4);
};

/*
 * Return a new PageSource instance from a directory path.
 *
 * @api public
 */

PageSource.build = function(app){
    return Directory.fromPath(app.get('pages:path')).then(function(dir){
        return PageSource.buildComponentTree(dir, app).then(function(tree){
            return new PageSource(tree, app).init();    
        });
    }).catch(function(e){
        logger.warn('Could not create page tree - ' + e.message);
        return new PageSource([], app).init();
    });
};

/*
 * Takes a directory and recursively converts it into a tree of pages
 *
 * @todo
 * @public
 */

PageSource.buildPageTree = function(dir, app){
    
    var ret = [];

    function makeGroupPromise(directory){
        return PageSource.buildPageTree(directory, app).then(function(subtree){
            if (_.isArray(subtree)) {
                return Group.fromDirectory(directory, subtree, app);
            }
            return subtree;
        });
    }

    _.each(dir.getChildren(), function(entity){
        if (entity.type == 'file') {
            var matches = file.matches(app.get('pages:match'));
            if (matches) {
                ret.push(Page.fromFile(file, dir, app));
            }
        } else {
            if (entity.hasChildren()) {
                ret.push(makeGroupPromise(entity));
            }
        }
        return null;
    });

    return Promise.all(ret).then(function(items){
        var items = _.compact(items);
        return _.isArray(items) ? _.sortByOrder(items, ['order','label'], ['asc','asc']) : items;
    });
};