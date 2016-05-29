// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
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

  // Support
  var self = this;
  this.userTurn = false;

  // Model
  this.field = new Field();
  ufn.makeWorker(worker, function(workerReady) {
    self.state = workerReady;
    self.state.onmessage = self.respond.bind(self);
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
    self.action();
  });

};

Game.prototype = {

  constructor: TRIPLET.Game,

  onClick: function(event) {
    var coords = html.getClickCoords(event);
    if (this.userTurn) {
      this.userTurn = false;
      this.tryMove(this.field.getCellPosition(coords.x, coords.y));
    } else {
      // Ask user to wait or terminate
    }
  },

  respond: function(message) {
    if (message.data.bestMove) this.tryMove(message.data.bestMove);
    else this.action(message.data);
  },

  tryMove: function(cell) {
    this.state.postMessage({ move: cell });
  },

  action: function(result) {
    if (result) {
      if (result.success)
        this.picture.drawSign(result.lastMove.row, result.lastMove.col,
                              result.lastMove.player);
      if (result.player.isUser) {
        this.userTurn = true;
        console.log('User turn.');  // Ask user to make turn without console
      }
      else this.state.postMessage({ advice: true });
    } else {
      this.state.postMessage(0);
    }
  }

};

return Game;

})();
