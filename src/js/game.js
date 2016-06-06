// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
// TODO Add some idle time for drawning field
// TODO Maybe Field and Canvas should not be made here
// TODO End game if bestMove is null
// TODO Maybe partsToLoad should be dynamic number
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

  var self = this,
      partsToLoad = 3;
  this.userTurn = false;

  function startGame() {
    if (--partsToLoad) return;
    self.picture.drawField();
    self.canvas.addEventListener('click', self.onClick.bind(self));
    self.action();
  }

  assets.images.load(cfg.assets.images, startGame);
  this.state = ufn.makeWorker({
    code: worker,
    onload: startGame,
    handler: this.respond.bind(this),
    importFrom: document.location.href.replace(/[^\/]*$/, '') + 'js' + '/'
  });

  this.field = new Field();
  this.canvas = html.makeCanvas(
      'triplet-' + id,
      cfg.general.left + cfg.general.right + this.field.width,
      cfg.general.top + cfg.general.bottom + this.field.height,
      document.getElementsByTagName('body')[0]);
  this.picture = new Picture(this.field, this.canvas);

  startGame();

};

Game.prototype = {

  constructor: Game,

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
    console.log('time: ' + message.data.aiSpeed);
    if (message.data.bestMove) {
      this.tryMove(message.data.bestMove);
      console.log('minimax score: ' + message.data.bestMove.score[0]);
    }
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
      } else if (result.bestMove !== null) {
        this.state.postMessage({ advice: true });
      } else {
        this.state.terminate();
        throw new Error('Worker failed and was terminated. Restart app.');
      }
    } else {
      this.state.postMessage(0);
    }
  }

};

return Game;

})();
