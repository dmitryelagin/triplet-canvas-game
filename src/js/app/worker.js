// TODO Refactor handleMessage function
// TODO Later delete TRIPLET object making from here
// Worker script for ai computing
import { random } from './utilities';
import State from './state';

export default function worker() {
  onmessage = (() => {
    let state;

    function handleMessage(e) {
      const aiStartTime = Date.now();
      const reply = {};
      if (e.data.move) {
        reply.success = !!state.makeMove(e.data.move.row, e.data.move.col);
        reply.lastMove = state.lastMove;
        reply.wins = state.findWin();
        reply.tie = state.isTie;
        reply.terminate = reply.tie || reply.wins.some(val => val);
      }
      if (e.data.ai) reply.aiMove = random.item(state.nextBestMoves) || null;
      reply.player = state.currentPlayer;
      reply.aiSpeed = Date.now() - aiStartTime;
      postMessage(reply);
      if (reply.terminate) close();
    }

    function initialize(href) {
      importScripts(
          `${href}utilities.js`, `${href}config.js`,
          `${href}player.js`, `${href}state.js`);
      state = new State();
    }

    function init(e) {
      try {
        initialize(e.data.href);
        onmessage = handleMessage;
        postMessage({ init: true });
      } catch (err) {
        postMessage({ init: false, error: err.message });
      }
    }

    return init;
  })();
}
