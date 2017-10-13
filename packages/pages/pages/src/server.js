const {Server} = require('@frctl/server');

module.exports = async function (fractal, pages, opts = {}) {

  const server = new Server();

  server.use(async (ctx, next) => {
    // TODO: proper error page
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = `
        <h1>${err.message}</h1>
        <p>${err.stack}</p>
      `;
    }
  });

  server.use(async (ctx, next) => {
    const result = await pages.build(fractal, {
      pages: [ctx.request.path]
    });
    await next();
  });

  server.addStatic(pages.get('dest'));

  [pages, fractal].forEach(app => {
    app.parse();
    app.watch();
  });

  await server.start(opts.port);

  return server;
};
