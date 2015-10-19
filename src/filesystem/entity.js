/**
 * Module dependencies.
 */

var path        = require('path');
var _           = require('lodash');

/*
 * Export the mixin.
 */

module.exports = entity;


function entity(){

    /*
     * Initialisation to set common properties.
     *
     * @api private
     */

    this.init = function(){
        
        // this.absolutePath       = this.absolutePath.toLowerCase();
        // this.path               = this.path.toLowerCase();

        var fileInfo            = path.parse(this.absolutePath);
        var relativefileInfo    = path.parse(this.path);
        var nameParts           = fileInfo.name.match(/^_?(\d+)\-(.*)/,'');

        this.relativePath       = this.path;
        this.ext                = this.isFile() ? fileInfo.ext : null;
        this.name               = nameParts ? nameParts[2] : fileInfo.name; // remove order from filename
        this.base               = this.name + this.ext;
        this.dir                = fileInfo.dir;
        this.relativeDir        = relativefileInfo.dir;
        
        this.pathSegments       = _.compact(this.path.split('/'));

        this.modified           = this.stat.mtime;

        this.order              = nameParts ? parseInt(nameParts[1], 10) : Infinity;
        this.hidden             = !! _.find(this.pathSegments, function(segment){
                                    return segment.charAt(0) === '_';
                                });
        
        if (this.isFile()) {
            this.raw = this.contents;
        }

        return this;
    };

    /*
     * Directory test.
     *
     * @api public
     */

    this.isDirectory = function(){
        return this.type === 'directory';
    }; 

    /*
     * File test.
     *
     * @api public
     */

    this.isFile = function(){
        return this.type === 'file';
    };

    /*
     * Generic type test.
     *
     * @api public
     */

    this.isType = function(type){
        return this.type === type;
    };

    /*
     * Check if the file matches a matcher object
     *
     * @api public
     */
    
    this.matches = function(matcher, replacements){
        if (replacements) {
            _.each(replacements, function(replacement, variable){
                matcher = matcher.replace('{{' + variable + '}}', replacement.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
            });
        }
        var tester = new RegExp(matcher, 'i');
        return tester.test(this.base);
    };

};

