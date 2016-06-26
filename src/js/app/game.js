// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
// TODO Add some idle time for drawning field
// TODO Maybe Field and Canvas should not be made here
// TODO Maybe partsToLoad should be dynamic or private number
// TODO Many string values should be in config
// TODO Add end game functionality
// Game main presenter
define(
    ['./config', './assets', './utilities', './worker', './field', './picture'],
    ({ general: cfg, assets: links }, { images }, { worker, html }, code,
        Field, Picture) =>
  class Game {

    constructor(id = 0, amdCfg) {
      let partsToLoad = 3;
      const tryToStartGame = () => {
        if (--partsToLoad) return;
        this.picture.drawField();
        this.canvas.addEventListener('click', this.onClick.bind(this));
        this.action();
      };
      this.userTurn = false;

      this.field = new Field();
      this.canvas = html.makeCanvas(
          `triplet-${id}`,
          cfg.left + cfg.right + this.field.width,
          cfg.top + cfg.bottom + this.field.height,
          document.getElementsByTagName('body')[0]);
      this.picture = new Picture(this.field, this.canvas);

      images.load(links.images, () => {
        this.picture.initialize(images.pool);
        tryToStartGame();
      });
      this.state = worker.fromFn({
        code, amdCfg,
        onload: tryToStartGame,
        handler: this.respond.bind(this),
        href: document.location.href.replace(/[^\/]*$/, ''),
      });

      tryToStartGame();
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
        if (result.player.isUser) {
          this.userTurn = true;
          console.log('User turn.');
        } else if (result.aiMove !== null) {
          this.state.postMessage({ ai: true });
        } else {
          this.state.terminate();
          throw new Error('Worker failed and was terminated. Restart app.');
        }
      } else {
        this.state.postMessage(0);
      }
    }

  }
);
