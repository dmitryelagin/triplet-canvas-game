// TODO Add timers for later optimization
// TODO Refactor handleMessage
// TODO Function handleMessage should work noramlly with human player
// Worker script for ai computing
TRIPLET.worker = function() {

TRIPLET = {};

onmessage = (function() {

  var state;

  function handleMessage(e) {
    var aiStartTime, currentPlayer, answer;
    player = state.getCurrentPlayer();
    answer = {
      success: state.makeMove(e.data.row, e.data.col),
      lastMove: state.lastMove,
      win: state.findWin(),
      tie: state.isTie()
    };
    answer.waitForAnswer = answer.success && !answer.tie &&
        !answer.lastMove.player.isUser &&
        !answer.win.some(function(val) {
          return val !== undefined;
        });
    postMessage(answer);
    if (answer.waitForAnswer) {
      aiStartTime = new Date();
      answer.bestMove = state.findNextBestMove();
      answer.aiSpeed = new Date() - aiStartTime;
      answer.waitForAnswer = false;
      postMessage(answer);
    }
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
