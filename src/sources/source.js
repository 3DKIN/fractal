/**
 * Module dependencies.
 */

var _ = require('lodash');

/*
 * Export the mixin.
 */

module.exports = source;


function source(){

    /*
     * Initialisation to set common properties.
     *
     * @api private
     */

    this.init = function(){

        return this;
    };

    /*
     * Alias for the resolve() method
     *
     * @api private
     */

    this.find = function(str){
        return this.resolve(str);
    };

};
