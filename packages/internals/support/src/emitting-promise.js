/* eslint guard-for-in: "off" */
const {EventEmitter2} = require('eventemitter2');
const assert = require('check-types').assert;

class EmittingPromise extends Promise {
  constructor(resolver, customEmitter) {
    assert.function(resolver, `EmittingPromise constructor requires a resolver with params 'resolve, reject [, emit]' [invalid-resolver]`);
    const emitter = customEmitter || new EventEmitter2({
      wildcard: true
    });

    const oldEmit = emitter.emit.bind(emitter);
    emitter.emit = function (...args) {
      process.nextTick(() => oldEmit(...args));
      return this;
    };

    super((resolve, reject) => resolver(resolve, reject, emitter));

    for (let prop in emitter) {
      Reflect.defineProperty(this, prop, {
        get: function () {
          return Reflect.get(emitter, prop);
        },
        set: function (value) {
          return Reflect.set(emitter, prop, value);
        },
        enumerable: true
      });
    }

    this.emitter = emitter;
  }

  get [Symbol.toStringTag]() {
    return 'EmittingPromise';
  }

}
module.exports = EmittingPromise;
