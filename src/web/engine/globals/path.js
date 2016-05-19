'use strict';

const _    = require('lodash');
const Path = require('path');

module.exports = function(app, engine) {

    return {
        name: 'path',
        value: function(str, req) {
            if (engine.env === 'server' || str.startsWith('http') || str.startsWith('.')) {
                return str;
            }
            let request = req || this.lookup('request');
            const currentPath = getStaticPagePath(_.get(request, 'path', '/'));
            let url = '/' + _.trim(Path.extname(str) ? str : getStaticPagePath(str), '/');
            return Path.relative(currentPath, url).replace(/^\.\.\//,'');
        }
    }

};

function getStaticPagePath(url) {
    if (url == '/') {
        return '/index.html'
    }
    const parts = Path.parse(url);
    return Path.join(parts.dir, parts.name + '.html');
}
