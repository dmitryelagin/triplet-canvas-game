// Game main presenter
TRIPLET.Game = (function() {

var cfg = TRIPLET.config,
    assets = TRIPLET.assets,
    html = TRIPLET.html,
    worker = TRIPLET.worker,
    ufn = TRIPLET.utilities.function,
    Field = TRIPLET.Field,
    State = TRIPLET.State,
    Picture = TRIPLET.Picture,
    Game;

Game = function(id) {

  // Object
  var self = this;

  // Model
  this.field = new Field();
  ufn.makeWorker(worker, function(workerReady) {
    self.state = workerReady;
    self.state.onmessage = self.respond;
  }, 'js');

  // View
  this.picture = new Picture(
      this.field,
      html.makeCanvas(
          'triplet-' + id,
          cfg.general.left + cfg.general.right + this.field.width,
          cfg.general.top + cfg.general.bottom + this.field.height,
          document.getElementsByTagName('body')[0]));

  // Preload
  assets.images.load(cfg.assets.images, function() {
    self.picture.drawField();
    self.picture.canvas.addEventListener('click', self.onClick.bind(self));
  });

};

Game.prototype = {

  constructor: TRIPLET.Game,

  onClick: function(event) {
    var coords = html.getClickCoords(event);
    this.state.postMessage({
      move: this.field.getCellPosition(coords.x, coords.y)
    });
  },

  respond: function(message) {
    console.log(message.data);
  }

};

return Game;

})();
