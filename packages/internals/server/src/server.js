const Koa = require('koa');
const {Fractal} = require('@frctl/fractal');

const _app = new WeakMap();
const _port = new WeakMap();
const _router = new WeakMap();
const _server = new WeakMap();

class Server {

  constructor(fractal, opts = {}) {
    if (!Fractal.isFractal(fractal)) {
      throw new TypeError(`Server.constructor - first argument must be an instance of Fractal [fractal-missing]`);
    }

    const app = new Koa();
    const router = require('./router')(fractal, opts.router);

    app.use(router.routes()).use(router.allowedMethods());

    _app.set(this, app);
    _router.set(this, router);
  }

  start(port) {
    return new Promise((resolve, reject) => {
      if (!port) {
        return reject(new Error(`You must supply a port number to start the server on [port-missing]`));
      }
      const httpServer = _app.get(this).listen(port, err => {
        if (err) {
          return reject(err);
        }
        _port.set(this, port);
        _server.set(this, httpServer);
        resolve(httpServer);
      });
    });
  }

  stop() {
    if (!this.started) {
      throw new Error('Server has not been started');
    }
    _server.get(this).close();
    _server.set(this, undefined);
    return this;
  }

  get started() {
    return Boolean(_server.get(this));
  }

  get port() {
    if (this.started) {
      return _port.get(this);
    }
    return null;
  }

  get app() {
    return _app.get(this);
  }

  get router() {
    return _router.get(this);
  }

  get httpServer() {
    return _app.get(this);
  }

}

module.exports = Server;
