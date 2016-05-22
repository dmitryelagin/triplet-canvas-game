// Game main controller
TRIPLET.Game = (function() {

var cfg = TRIPLET.config,
    assets = TRIPLET.assets,
    html = TRIPLET.html,
    Field = TRIPLET.Field,
    State = TRIPLET.State,
    Picture = TRIPLET.Picture,
    Game;

Game = function(id) {

  var self = this;

  // Model
  this.field = new Field();
  this.state = new State();

  // View
  this.picture = new Picture(
      this.field,
      html.makeCanvas(
          'triplet-' + id,
          cfg.general.left + cfg.general.right + this.field.width,
          cfg.general.top + cfg.general.bottom + this.field.height,
          document.getElementsByTagName('body')[0]));

  assets.images.load(cfg.assets.images, function() {
    self.picture.drawField();
    self.picture.canvas.addEventListener('click', self.onClick);
  });

};

Game.prototype = {

  constructor: TRIPLET.Game,

  onClick: function() {

  }

};

return Game;

})();
