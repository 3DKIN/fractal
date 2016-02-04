'use strict';

const Promise = require('bluebird');
const Path    = require('path');
const co      = require('co');
const builder = require('./builder');

module.exports = function build(config, app){

    const theme = app.theme;
    const log   = app.log;

    if (!theme.buildDir()) {
        log.error('You need to specify a build destination in your configuration.');
        process.exit(1);
        return;
    }
    theme.static().forEach(stat => {
        if (stat.path == theme.buildDir()) {
            log.error(`Your build destination directory (${Path.resolve(stat.path)}) cannot be the same as your static assets directory.`);
            process.exit(1);
        }
    });

    const bob = builder(theme);

    co(function* (){
        const api = yield app();

        yield bob.before();

        yield theme.static().map(p => bob.copyStatic(p.path, p.mount));

        theme.builder()(bob, api);

        yield bob.after();

    }).catch(err => {
        log.error(err);
    });

};
