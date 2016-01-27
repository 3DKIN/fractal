'use strict';

const Emitter         = require('events').EventEmitter;
const _               = require('lodash');
const co              = require('co');
const logger          = require('./logger');
const config          = require('./config');
const pages           = require('./pages');
const components      = require('./components');

// const handlers    = new Map();

const app = module.exports = {

    run(argv) {

        const input = this._parseArgv(argv);

        // console.time('tree');
        // pages.load().then(function (tree) {
        //     logger.dump(tree);
        // }).catch(function(err){
        //     console.log(err);
        // });



        components.load().then(function (tree) {
            
            // logger.dump(tree);
        }).catch(function(err){
            console.log(err);
        });
    },

    get version() {
        return config.get('version');
    },

    get env() {
        return config.get('env');
    },

    /*
     * Parse the supplied argv to extract a command, arguments and options
     *
     * @api private
     */

    _parseArgv(argv) {
        const args = argv._;
        const command = args.shift();
        const opts = argv;
        delete opts._;
        delete opts.$0;
        return {
            command: command,
            args: args,
            opts: opts
        };
    }

};

Object.assign(app, Emitter.prototype);
Object.assign(app, config);
