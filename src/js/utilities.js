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
    }

  },

};
