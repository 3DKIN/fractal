module.exports = function (opts = {}) {
  return {

    name: 'pages',

    commands: [
      require('./src/commands/info')(opts),
      require('./src/commands/author')(opts),
      require('./src/commands/build')(opts)
    ]

  };
};
