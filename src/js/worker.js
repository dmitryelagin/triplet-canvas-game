// TODO Refactor handleMessage function
// TODO Later delete TRIPLET object making from here
// Worker script for ai computing
TRIPLET.worker = function() {

TRIPLET = {};

onmessage = (function() {

  var state, random;

  function handleMessage(e) {
    var answer = {},
        aiStartTime = Date.now();
    if (e.data.move) {
      answer.success = !!state.makeMove(e.data.move.row, e.data.move.col);
      answer.lastMove = state.lastMove;
      answer.wins = state.findWin();
      answer.tie = state.isTie();
      answer.terminate = answer.tie ||
          answer.wins.some(function(val) { return val; });
    }
    if (e.data.advice)
      answer.bestMove = random.item(state.findNextBestMoves()) || null;
    answer.player = state.getCurrentPlayer();
    answer.aiSpeed = Date.now() - aiStartTime;
    postMessage(answer);
    if (answer.terminate) close();
  }

  function initialize(data) {
    importScripts(data.href + 'utilities.js', data.href + 'config.js',
                  data.href + 'player.js', data.href + 'state.js');
    state = new TRIPLET.State();
    random = TRIPLET.utilities.random;
  }

  function init(e) {
    try {
      initialize(e.data);
      onmessage = handleMessage;
      postMessage({ init: true });
    } catch(err) {
      postMessage({ init: false, error: err.message });
    }
  }

  return init;

})();

};
