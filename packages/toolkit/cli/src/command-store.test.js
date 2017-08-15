const {Command} = require('@frctl/support');
const {expect} = require('../../../../test/helpers');
const CommandStore = require('./command-store');

const commands = [{
  name: 'do-that',
  command: 'dothat',
  handler: () => Promise.resolve('all done')
}, {
  name: 'do-this',
  command: 'dothis',
  handler: () => Promise.resolve('all done')
}];

function makeStore(commands = []) {
  return new CommandStore(commands);
}

describe('Cli - CommandStore', function () {
  describe('constructor', function () {
    it('adds commands if provided', function () {
      const commandStore = new CommandStore(commands);
      expect(commandStore.commands.length).to.equal(commands.length);
      const emptyCommandStore = new CommandStore();
      expect(emptyCommandStore.commands.length).to.equal(0);
    });
  });

  describe('.add()', function () {
    it('adds a single command', function () {
      const commandStore = makeStore();
      commandStore.add(commands[0]);
      expect(commandStore.commands.length).to.equal(1);
      expect(commandStore.commands[0].name).to.equal(commands[0].name);
    });
    it('adds an array of commands', function () {
      const commandStore = makeStore();
      commandStore.add(commands);
      expect(commandStore.commands.length).to.equal(commands.length);
      expect(commandStore.commands[0].name).to.equal(commands[0].name);
      expect(commandStore.commands[1].name).to.equal(commands[1].name);
    });
    it('pushes commands onto the end of the stack', function () {
      const commandStore = makeStore();
      commandStore.add(commands[0]);
      commandStore.add(commands[1]);
      expect(commandStore.commands[1].name).to.equal(commands[1].name);
    });
    it('replaces previously added commands that have the same name', function () {
      const commandStore = makeStore();
      commandStore.add(commands);
      expect(commandStore.commands.length).to.equal(commands.length);
      commandStore.add({
        name: 'do-that',
        command: 'dosomething',
        handler: () => Promise.resolve('all done')
      });
      expect(commandStore.commands.length).to.equal(commands.length);
      const command = commandStore.commands.find(command => command.name === 'do-that');
      expect(command.command).to.equal('dosomething');
    });
    it('wraps all commands object sin Command instances', function () {
      const commandStore = makeStore();
      commandStore.add(commands);
      for (const command of commandStore.commands) {
        expect(command).to.be.instanceOf(Command);
      }
    });
  });

  describe('.commands', function () {
    it('returns the array of commands', function () {
      const commandStore = makeStore(commands);
      expect(commandStore.commands).to.be.an('array');
      expect(commandStore.commands.length).to.equal(commands.length);
      expect(commandStore.commands[0].name).to.equal(commands[0].name);
    });
  });
});
