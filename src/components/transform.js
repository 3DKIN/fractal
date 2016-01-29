'use strict';

const co             = require('co');
const _              = require('lodash');
const Component      = require('./component');
const engine         = require('./engine').config;
const match          = require('../matchers');
const app            = require('../app');
const source         = require('../source');
const fs             = require('../fs');
const data           = require('../data');
const config         = require('../config');
const logger         = require('../logger');
const Collection     = require('../collection');

module.exports = function(fileTree) {
    const splitter = config.get('components.splitter');
    const build = co.wrap(function* (dir, root) {
        const children = dir.children;

        // first figure out if it's a component directory or not...

        if (!root) {
            const componentView = _.find(children, { name: dir.name, ext: engine.ext });
            if (componentView) { // it is a component
                const conf = yield data.getConfig(match.findConfigFor(componentView.name, children), {
                    _name:    dir.name,
                    order:    dir.order,
                    isHidden: dir.isHidden,
                    view:     componentView.base
                });
                return Component.create(conf, children);
            }
        }

        // not a component, so go through the items and group into components and collections

        const directories    = children.filter(item => item.isDirectory);
        const collections    = yield directories.map(item => build(item));
        const componentViews = children.filter(match.components);
        const variants       = children.filter(match.variants);

        const components = yield componentViews.map(item => {
            const related = variants.filter(sibling => sibling.name.startsWith(item.name));
            const conf    = data.getConfig(match.findConfigFor(item.name, children), {
                _name:    item.name,
                order:    item.order,
                isHidden: item.isHidden,
                view:     item.base
            });
            return conf.then(c => Component.create(c, related));
        });

        const props = {
            name: dir.name
        };
        if (!root) {
            props.isHidden = dir.isHidden;
            props.order    = dir.order;
        }
        const dirConfig = yield data.getConfig(match.findConfigFor(dir.name, children), props);
        const items = _.orderBy(_.concat(components, collections), ['type', 'order', 'name'], ['desc', 'asc', 'asc']);
        return Collection.create(dirConfig, items);
    });
    return build(fileTree, true);
};
