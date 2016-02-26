'use strict';

const _        = require('lodash');
const chalk    = require('chalk');
const console  = require('./console');
const utils    = require('./utils');
const minimist = require('minimist');

module.exports = function (app, vorpal, defaults) {

    const commands  = new Set();
    const delimiter = chalk.magenta('fractal ➤');

    _.forEach(defaults, c => add(c.command, c.config || {}, c.action));

    function add(command, config, action) {
        if (_.isFunction(config)) {
            action = config;
            config = {};
        }
        if (_.isString(config)) {
            config = {
                description: config
            };
        }
        action = action || function(){};
        commands.add({
            command: command,
            action:  action,
            config:  config
        });
    }

    return {

        add: add,

        run() {

            const scope = app.scope;
            const input = utils.parseArgv();

            for (let item of commands.values()) {
                let commandScope = item.config.scope ? [].concat(item.config.scope) : ['project'];
                if (_.includes(commandScope, scope)) {
                    // command is in scope
                    const cmd = vorpal.command(item.command, item.config.description || ' ');
                    cmd.action(function(args, done){
                        this.console = console;
                        this.fractal = app;
                        let action = item.action.bind(this);
                        return action(args, done);
                    });
                    (item.config.options || []).forEach(opt => {
                        cmd.option(opt);
                    });
                    cmd.option('--nonint', 'Run the command in non-interactive mode');
                    cmd.__scope = commandScope;
                } else {
                    // command not available in this scope
                    const cmd = vorpal.command(item.command.replace(/\</g,'[').replace(/\>/g,']'), item.config.description || ' ');
                    cmd.action((args, done) => {
                        console.error(`This command is not available in a ${scope} context.`);
                        done();
                    })
                    .hidden()
                    .__scope = commandScope;
                }
            }

            var command = vorpal.find(input.command);

            if (command && !_.includes(command.__scope, scope)) {
                console.error(`This command is not available in a ${scope} context.`);
                return;
            }

            if (input.opts.nonint) {
                if (command) {
                    app.load().then(function(){
                        vorpal.parse(process.argv);
                    });
                    return;
                }
                console.error(`Command ${command} not recognised`);
            }

            if (command && (scope === 'global')) {
                vorpal.parse(process.argv);
                return;
            }

            if (!command && scope === 'global') {
                console.box(
                    `Fractal CLI`,
                    `${chalk.magenta('No local Fractal installation found.')}\nYou can use the 'fractal new' command to create a new project.`,
                    `Powered by Fractal v${app.version}`
                ).unslog();
            } else {
                console.slog().log('Initialising Fractal....');
                return app.load().then(() => {
                    app.watch();
                    vorpal.delimiter(delimiter);
                    vorpal.history('fractal');
                    console.box(
                        `Fractal interactive CLI`,
                        `- Use the 'help' command to see all available commands.\n- Use the 'exit' command to exit the app.`,
                        `Powered by Fractal v${app.version}`
                    ).unslog().br();
                    if (input.command) {
                        vorpal.parse(process.argv);
                    }
                    vorpal.show();
                });
            }
        },

        exec() {
            // run()
        }
    };

};
