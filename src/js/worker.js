// TODO Function handleMessage should work noramlly with human player
// Worker script for ai computing
TRIPLET.worker = function() {

TRIPLET = {};

onmessage = (function() {

  var state;

  function handleMessage(e) {
    var answer, aiStartTime = new Date();
    if (e.data.move) answer = {
      success: state.makeMove(e.data.move.row, e.data.move.col),
      lastMove: state.lastMove,
      wins: state.findWin(),
      tie: state.isTie()
    };
    if (e.data.advice) answer = {
      bestMove: state.findNextBestMove(e.data.advice)
    };
    answer.aiSpeed = new Date() - aiStartTime;
    postMessage(answer);
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
