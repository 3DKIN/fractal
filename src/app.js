'use strict';

const Promise         = require('bluebird');
const Emitter         = require('events').EventEmitter;
const _               = require('lodash');
const co              = require('co');
const logger          = require('./logger');
const config          = require('./config');

// const handlers    = new Map();

const app = module.exports = {

    run(argv) {

        const input = this._parseArgv(argv);
        this._setComponentEngine();

        const source = require('./source');
        const promises = {
            pages: source(config.get('pages.path'), 'pages'),
            components: source(config.get('components.path'), 'components')
        };

        Promise.props(promises).then(function (p) {

            const page = p.pages.find('index');
            const render = require('./pages/engine');

            logger.dump(render(page.content, page.context));
            //
            logger.dump(p.components.find('button').getVariant());

            // for (let item of p.pages) {
            //     console.log(item);
            // }

            // require('./services/server');
        }).catch(function (err) {
            console.log(err.stack);
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
    },

    _setComponentEngine(){
        let engine;
        const moduleName = config.get('components.view.engine');
        try {
            engine = require(moduleName);
        } catch(err) {
            throw new Error(`Could not find component engine module '${moduleName}'. Try running 'npm install ${moduleName} --save'.`);
        }
        const ext = config.get('components.view.ext') || engine.defaults.ext;
        if (!ext) {
            throw new Error(`No component extension found!`);
        }
        config.set('components.view.ext', ext.toLowerCase());
    }

};

Object.assign(app, Emitter.prototype);
Object.assign(app, config);
