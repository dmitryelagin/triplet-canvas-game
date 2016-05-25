// TODO Add timers for later optimization
// Worker script for ai computing
TRIPLET = {};

importScripts('utilities.js', 'config.js', 'player.js', 'state.js');

onmessage = (function() {

  var state = new TRIPLET.State();

  return function(e) {
    var currentPlayer = state.currentPlayer(),
        answer = {
          moveSuccess: state.makeMove(e.data.row, e.data.col),
          gameEnded: state.findWin() || state.isTie(),
          currentPlayerID: currentPlayer.queue
        };
    answer.waitForAnswer = answer.moveSuccess && !answer.gameEnded &&
        !currentPlayer.isUser;
    postMessage(answer);
    if (answer.waitForAnswer) postMessage({
      answer: state.findNextBestMove()
    });
  };

})();
