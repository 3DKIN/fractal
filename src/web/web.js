'use strict';

const _            = require('lodash');
const mix          = require('../core/mixins/mix');
const Configurable = require('../core/mixins/configurable');
const Emitter      = require('../core/mixins/emitter');
const Server       = require('./server');
const Builder      = require('./builder');
const Theme        = require('./theme');
const Engine       = require('./engine');

module.exports = class Web extends mix(Configurable, Emitter) {

    constructor(app){
        super(app);
        this.config(app.get('web'));
        this._app          = app;
        this._servers      = new Map();
        this._themes       = new Map();
        this.defaultTheme(this.get('theme'));
    }

    server(config) {
        let opts = _.defaultsDeep(config, this.get('server'));
        const theme  = this._loadTheme(opts.theme);
        const engine = new Engine(theme.loadPaths(), 'server', this._app);
        theme.emit('init', engine, this._app);
        engine.setGlobal('theme', theme);
        return new Server(theme, engine, opts, this._app);
    }

    builder(config) {
        let opts = _.defaultsDeep(config, this.get('builder'));
        const theme = this._loadTheme(opts.theme);
        const engine = new Engine(theme.loadPaths(), 'builder', this._app);
        theme.emit('init', engine, this._app);
        engine.setGlobal('theme', theme);
        return new Builder(theme, engine, opts, this._app);
    }

    theme(name, instance) {
        instance = instance || name;
        if (_.isString(instance)) {
            instance = require(instance)();
        }
        this._themes.set(name, instance);
        this._defaultTheme = name;
        return this;
    }

    defaultTheme(instance) {
        if (instance) {
            return this.theme('default', instance);
        }
        return this._themes.get('default');
    }

    _init(defaults) {
        let opts = _.defaultsDeep(config, defaults);
        const theme = this._loadTheme(opts.theme);
    }

    _loadTheme(theme){
        if (!theme) {
            theme = this.defaultTheme();
        }
        if (_.isString(theme)) {
            if (this._themes.has(theme)) {
                theme = this._themes.get(theme);
            } else {
                theme = require(theme)();
            }
        }
        if (!theme instanceof Theme) {
            throw new Error('Fractal themes must inherit from the base Theme class.');
        }
        // const stat = [].concat(this.get('static'));
        // for (let s of stat) {
        //     if (s.path) {
        //         theme.static(s.path, s.mount || '/');
        //     }
        // }
        // theme.init(new Engine(theme.loadPaths(), env, this._app), this._app);
        return theme;
    }
}
