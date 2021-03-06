// Game assets storage
TRIPLET.assets = (function() {

var Storage = function(loader) {
  this.loader = loader;
  this.finished = 0;
  this.pool = [];
  this.errors = [];
};

Storage.prototype = {

  constructor: Storage,

  load: function(loadList, callback) {
    function onEnd(save, value) {
      save.call(this, value);
      if (++this.finished >= loadList.length) callback();
    }
    loadList.forEach(function(link, index) {
      function onLoad(asset) {
        this.pool[index] = asset;
      }
      function onError(info) {
        this.errors[index] = info;
      }
      this.loader(link, onEnd.bind(this, onLoad), onEnd.bind(this, onError));
    }, this);
    this.load = typeof callback === 'function' ? callback : function() {};
  }

};

return {
  images: new Storage(function(link, onSuccess, onFail) {
    var img = new Image();
    img.src = link;
    img.onload = function() { onSuccess(img); };
    img.onerror = function() { onFail(link); };
  })
};

})();
