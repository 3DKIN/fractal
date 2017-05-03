const _ = require('lodash');
const loader = require('@frctl/utils/load');
const Surveyor = require('./surveyor');
const Commands = require('./commands');

const commands = new WeakMap();

class Fractal extends Surveyor {

  /**
   * Insantiate a new Fractal instance
   *
   * @param  {object} [config={}] A configuration object
   * @return {Fractal} The Fractal instance
   */
  constructor(config) {
    super(config);

    commands.set(this, new Commands());

    this.addConfigHandler('commands', items => {
      for (const [command, opts] of loader.resolve(items || [])) {
        this.addCommand(command(opts));
      }
    });
  }

  /**
   * Register a CLI command
   *
   * @param  {object} command The CLI object to register
   * @return {Fractal} The Fractal instance
   */
  addCommand(command) {
    commands.get(this).add(command);
    return this;
  }

  /**
   * The Fractal version specified in the package.json file
   */
  get version() {
    return require('../package.json').version;
  }

  /**
   * Registered commands
   * @return {Collection}
   */
  get commands() {
    return commands.get(this);
  }

}

module.exports = Fractal;
