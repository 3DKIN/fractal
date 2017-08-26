const Pages = require('./src/pages');

module.exports = function (opts = {}) {
  return {

    name: 'fractal-pages',

    commands: [
      require('./src/commands/info')(opts)
,      require('./src/commands/serve')(opts)
    ],

    register(fractal) {

    }

  };
};

module.exports.Pages = Pages;
