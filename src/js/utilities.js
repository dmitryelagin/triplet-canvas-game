// Support functions
TRIPLET.utilities = {

  object: {

    propFromTo: function(source, target) {
      for (var i in target)
        if (Object.prototype.hasOwnProperty.call(source, i) &&
            typeof source[i] === typeof target[i]) {
          target[i] = source[i];
        }
      return target;
    }

  },

  random: {

    sign: function() {
      return Math.random() - 0.5 > 0 ? 1 : -1;
    },

    error: function(range) {
      range = parseFloat(range) || 0;
      return this.sign() * Math.random() * range;
    },

    item: function(array) {
      if (array.hasOwnProperty('length') && array.length > 0)
        return array[Math.floor(Math.random() * array.length)];
    },

    makeRandomizer: function(arg) {
      if (arg === undefined) return this.sign;
      if (typeof arg === 'number') return this.error.bind(this, arg);
      if (Array.isArray(arg)) return this.item.bind(this, arg);
      throw new TypeError('No Randomizer for this argument: ' + arg);
    }

  },

  function: {

    makeWorker: function(fn, callback, subFolder, href) {
      var worker;
      if (typeof fn === 'function') {
        worker = new Worker(URL.createObjectURL(new Blob(
            [fn.toString().replace(/.*?{\s*/, '').replace(/\s*}.*$/, '')],
            { type: 'javascript/worker' })));
        worker.onmessage = function(e) {
          if (e.data.init) {
            worker.onmessage = function() {};
            callback(worker);
          } else {
            throw new Error('Worker can not be initialized: ' + e.data.error);
          }
        };
        worker.postMessage({
          href: typeof href === 'string' ? href : document.location.href,
          subFolder: typeof subFolder === 'string' ? subFolder : ''
        });
      }
    }

  }

};
