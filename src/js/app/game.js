// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
// TODO Add some idle time for drawning field
// TODO Maybe Field and Canvas should not be made here
// TODO Many string values should be in config
// TODO Add end game functionality
// TODO Maybe userTurn flag is not needed
// Game main presenter
define(
    ['./config', './assets', './utilities', './worker', './field', './picture'],
    ({ general: cfg, assets: links }, { images }, { worker, html }, code,
        Field, Picture) =>
  class Game {

    constructor(id = 0, amdCfg) {
      let waitLoad = this.constructor.toString().match(/startGame/g).length - 2;
      // Not an arrow function because of possible compilation errors
      function startGame() {
        if (--waitLoad) return;
        this.picture.drawField();
        this.canvas.addEventListener('click', this.onClick.bind(this));
        this.action();
      }

      this.userTurn = false;
      this.field = new Field();
      this.canvas = html.makeCanvas(
          `triplet-${id}`,
          cfg.left + cfg.right + this.field.width,
          cfg.top + cfg.bottom + this.field.height,
          document.getElementsByTagName('body')[0]);
      this.picture = new Picture(this.field, this.canvas);

      const tryInitSprites = () => this.picture.initialize(images.pool);
      images.load(links.images)
          .then(tryInitSprites, tryInitSprites)
          .then(() => startGame.call(this))
          .catch(() => {
            throw new Error(`Many sprites are missed: ${images.pool}`);
          });

      worker.fromFn({
        code,
        args: amdCfg,
        handler: this.respond.bind(this),
        href: document.location.href.replace(/[^\/]*$/, ''),
      }).then(wrkr => {
        this.state = wrkr;
        startGame.call(this);
      });

      startGame();
    }

    onClick(e) {
      if (this.userTurn) {
        this.userTurn = false;
        const { x, y } = html.clickCoords(e);
        this.tryMove(this.field.getCellPosition(x, y));
      } else {
        console.log('Please wait for your turn.');
      }
    }

    respond(message) {
      console.log(`time: ${message.data.aiSpeed}`);
      if (message.data.aiMove) {
        this.tryMove(message.data.aiMove);
        console.log(`minimax score: ${message.data.aiMove.score[0]}`);
      } else {
        this.action(message.data);
      }
    }

    tryMove(cell) {
      this.state.postMessage({ move: cell });
    }

    action(result) {
      if (result) {
        if (result.success) {
          const { row, col, player } = result.lastMove;
          this.picture.drawSign(row, col, player.id);
        }
        if (result.terminate) {
          this.state.terminate();
          console.log('Game ended.');
        } else if (result.player.isUser) {
          this.userTurn = true;
          console.log('User turn.');
        } else {
          this.state.postMessage({ ai: true });
          console.log('AI turn.');
        }
      } else {
        this.state.postMessage(0);
      }
    }

  }
);
