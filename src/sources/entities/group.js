/**
 * Module dependencies.
 */

var Promise     = require('bluebird');
var _           = require('lodash');

var mixin       = require('./entity');
var utils       = require('../../utils');

/*
 * Export the group.
 */

module.exports = Group;

/*
 * Group constructor.
 *
 * @api private
 */

function Group(dir, config, children){
    this.type       = 'group';
    this._dir       = dir;
    this._config    = config;
    this.handle     = dir.name;
    this.label      = config.label || utils.titlize(dir.name);
    this.title      = config.title || this.label;
    this.order      = dir.order;
    this.depth      = dir.depth;
    this.children   = children;
};

mixin.call(Group.prototype);

/*
 * Get a static, JSON-style object representation of the group.
 * Good for using with templating languages.
 *
 * @api public
 */

Group.prototype.toJSON = function(){
    var obj = {};
    _.forOwn(this, function(value, key){
        if (!_.startsWith(key, '_')) {
            obj[key] = value;
        }
    });
    _.map(obj.children, function(item){
        return item.toJSON();
    });
    return obj;
};

/*
 * Factory method to create a new group instance from a directory.
 * Returns a promise.
 *
 * @api public
 */

Group.fromDirectory = function(dir, config, children){
    return Promise.resolve(new Group(dir, config, children));
};