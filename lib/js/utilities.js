'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// TODO Maybe remove ObjectURL after worker is started
// Support functions
TRIPLET.utilities = {

  object: {

    propFromTo: function propFromTo(source, target) {
      for (var i in target) {
        if (Object.prototype.hasOwnProperty.call(source, i) && _typeof(source[i]) === _typeof(target[i])) {
          target[i] = source[i];
        }
      }return target;
    }

  },

  random: {

    sign: function sign() {
      return Math.random() - 0.5 > 0 ? 1 : -1;
    },

    error: function error(range) {
      range = parseFloat(range) || 0;
      return this.sign() * Math.random() * range;
    },

    item: function item(array) {
      if (array.hasOwnProperty('length') && array.length > 0) return array[Math.floor(Math.random() * array.length)];
    },

    makeRandomizer: function makeRandomizer(arg) {
      if (arg === undefined) return this.sign;
      if (typeof arg === 'number') return this.error.bind(this, arg);
      if (Array.isArray(arg)) return this.item.bind(this, arg);
      throw new TypeError('No Randomizer for this argument: ' + arg);
    }

  },

  function: {

    makeWorker: function makeWorker(cfg) {
      var worker;
      function isFn(fn) {
        return typeof fn === 'function';
      }
      if (isFn(cfg.code)) {
        worker = new Worker(URL.createObjectURL(new Blob([cfg.code.toString().replace(/.*?{\s*/, '').replace(/\s*}.*$/, '')], { type: 'javascript/worker' })));
        worker.onmessage = function (e) {
          if (e.data.init) {
            if (isFn(cfg.handler)) worker.onmessage = cfg.handler;
            if (isFn(cfg.onload)) cfg.onload(worker, e.data.args);
          } else {
            throw new Error('Worker can not be initialized: ' + e.data.error);
          }
        };
        worker.postMessage({ href: cfg.importFrom || '', args: cfg.args });
        return worker;
      }
    }

  }

};
//# sourceMappingURL=data:application/json;base64,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QW1CLEVBQUUsTUFBTSxJQUFJLFVBQUosSUFBa0IsRUFBMUIsRUFBOEIsTUFBTSxJQUFJLElBQXhDLEVBQW5CO0FBQ0EsZUFBTyxNQUFQO0FBQ0Q7QUFDRjs7QUFwQk87O0FBeENRLENBQXBCIiwiZmlsZSI6ImpzL3V0aWxpdGllcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gTWF5YmUgcmVtb3ZlIE9iamVjdFVSTCBhZnRlciB3b3JrZXIgaXMgc3RhcnRlZFxyXG4vLyBTdXBwb3J0IGZ1bmN0aW9uc1xyXG5UUklQTEVULnV0aWxpdGllcyA9IHtcclxuXHJcbiAgb2JqZWN0OiB7XHJcblxyXG4gICAgcHJvcEZyb21UbzogZnVuY3Rpb24oc291cmNlLCB0YXJnZXQpIHtcclxuICAgICAgZm9yICh2YXIgaSBpbiB0YXJnZXQpXHJcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGkpICYmXHJcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbaV0gPT09IHR5cGVvZiB0YXJnZXRbaV0pIHtcclxuICAgICAgICAgIHRhcmdldFtpXSA9IHNvdXJjZVtpXTtcclxuICAgICAgICB9XHJcbiAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJhbmRvbToge1xyXG5cclxuICAgIHNpZ246IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAtIDAuNSA+IDAgPyAxIDogLTE7XHJcbiAgICB9LFxyXG5cclxuICAgIGVycm9yOiBmdW5jdGlvbihyYW5nZSkge1xyXG4gICAgICByYW5nZSA9IHBhcnNlRmxvYXQocmFuZ2UpIHx8IDA7XHJcbiAgICAgIHJldHVybiB0aGlzLnNpZ24oKSAqIE1hdGgucmFuZG9tKCkgKiByYW5nZTtcclxuICAgIH0sXHJcblxyXG4gICAgaXRlbTogZnVuY3Rpb24oYXJyYXkpIHtcclxuICAgICAgaWYgKGFycmF5Lmhhc093blByb3BlcnR5KCdsZW5ndGgnKSAmJiBhcnJheS5sZW5ndGggPiAwKVxyXG4gICAgICAgIHJldHVybiBhcnJheVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnJheS5sZW5ndGgpXTtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVJhbmRvbWl6ZXI6IGZ1bmN0aW9uKGFyZykge1xyXG4gICAgICBpZiAoYXJnID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzLnNpZ247XHJcbiAgICAgIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgcmV0dXJuIHRoaXMuZXJyb3IuYmluZCh0aGlzLCBhcmcpO1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSByZXR1cm4gdGhpcy5pdGVtLmJpbmQodGhpcywgYXJnKTtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTm8gUmFuZG9taXplciBmb3IgdGhpcyBhcmd1bWVudDogJyArIGFyZyk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGZ1bmN0aW9uOiB7XHJcblxyXG4gICAgbWFrZVdvcmtlcjogZnVuY3Rpb24oY2ZnKSB7XHJcbiAgICAgIHZhciB3b3JrZXI7XHJcbiAgICAgIGZ1bmN0aW9uIGlzRm4oZm4pIHsgcmV0dXJuIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJzsgfVxyXG4gICAgICBpZiAoaXNGbihjZmcuY29kZSkpIHtcclxuICAgICAgICB3b3JrZXIgPSBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoXHJcbiAgICAgICAgICAgIFtjZmcuY29kZS50b1N0cmluZygpLnJlcGxhY2UoLy4qP3tcXHMqLywgJycpLnJlcGxhY2UoL1xccyp9LiokLywgJycpXSxcclxuICAgICAgICAgICAgeyB0eXBlOiAnamF2YXNjcmlwdC93b3JrZXInIH0pKSk7XHJcbiAgICAgICAgd29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIGlmIChlLmRhdGEuaW5pdCkge1xyXG4gICAgICAgICAgICBpZiAoaXNGbihjZmcuaGFuZGxlcikpIHdvcmtlci5vbm1lc3NhZ2UgPSBjZmcuaGFuZGxlcjtcclxuICAgICAgICAgICAgaWYgKGlzRm4oY2ZnLm9ubG9hZCkpIGNmZy5vbmxvYWQod29ya2VyLCBlLmRhdGEuYXJncyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dvcmtlciBjYW4gbm90IGJlIGluaXRpYWxpemVkOiAnICsgZS5kYXRhLmVycm9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7IGhyZWY6IGNmZy5pbXBvcnRGcm9tIHx8ICcnLCBhcmdzOiBjZmcuYXJncyB9KTtcclxuICAgICAgICByZXR1cm4gd29ya2VyO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn07XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
