/* jshint esversion: 6 */
// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
// TODO Add some idle time for drawning field
// TODO Maybe Field and Canvas should not be made here
// TODO Maybe partsToLoad should be dynamic or private number
// TODO Many values should be in config
// Game main presenter
import cfg from 'config';
import assets from 'assets';
import html from 'html';
import worker from 'worker';
import { makeWorker } from 'utilities';
import Field from 'field';
import Picture from 'picture';

export default class Game {

  constructor (id = 0) {
    const startGame = () => {
      if (--partsToLoad) return;
      this.picture.drawField();
      this.canvas.addEventListener('click', this.onClick.bind(this));
      this.action();
    };
    let partsToLoad = 3;
    this.userTurn = false;

    assets.images.load(cfg.assets.images, startGame);
    this.state = makeWorker({
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
  }

  onClick (e) {
    if (this.userTurn) {
      this.userTurn = false;
      let { x, y } = html.getClickCoords(e);
      this.tryMove(this.field.getCellPosition(x, y));
    } else {
      console.log('Please wait for your turn.');
    }
  }

  respond (message) {
    console.log('time: ' + message.data.aiSpeed);
    if (message.data.bestMove) {
      this.tryMove(message.data.bestMove);
      console.log('minimax score: ' + message.data.bestMove.score[0]);
    }
    else this.action(message.data);
  }

  tryMove (cell) {
    this.state.postMessage({ move: cell });
  }

  action (result) {
    if (result) {
      if (result.success) {
        let { row, col, player } = result.lastMove;
        this.picture.drawSign(row, col, player);
      }
      if (result.player.isUser) {
        this.userTurn = true;
        console.log('User turn.');
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

}
