// TODO Refactor handleMessage function
// TODO Later delete TRIPLET object making from here
// Worker script for ai computing
TRIPLET.worker = function() {

TRIPLET = {};

onmessage = (function() {

  var state, random;

  function handleMessage(e) {
    var answer = {},
        aiStartTime = new Date();
    if (e.data.move) {
      answer.success = state.makeMove(e.data.move.row, e.data.move.col);
      answer.lastMove = state.lastMove;
      answer.wins = state.findWin();
      answer.tie = state.isTie();
      answer.terminate = answer.wins.some(function(val) {
        return val !== undefined;
      }) || answer.tie;
    }
    if (e.data.advice)
      answer.bestMove = random.item(state.findNextBestMoves()) || null;
    answer.player = state.getCurrentPlayer();
    answer.aiSpeed = new Date() - aiStartTime;
    postMessage(answer);
    if (answer.terminate) close();
  }

  function init(e) {
    var sub, href;
    if (e.data.href) {
      try {
        sub = e.data.subFolder || '';
        href = e.data.href.replace(/[^\/]*$/, '') +
            sub.replace(/\\/g, '/').replace(/^\/|\/$/g, '') + '/';
        importScripts(href + 'utilities.js', href + 'config.js',
                      href + 'player.js', href + 'state.js');
        state = new TRIPLET.State();
        random = TRIPLET.utilities.random;
        onmessage = handleMessage;
        postMessage({ init: true });
      } catch(err) {
        postMessage({ init: false, error: err });
      }
    } else {
      postMessage('Worker needs main file location: ' + e.data);
    }
  }

  return init;

})();

};
