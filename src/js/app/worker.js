// TODO Refactor handleMessage function
// TODO Later delete TRIPLET object making from here
// Worker script for ai computing
define(() =>
  function worker() {
    self.onmessage = (() => {
      let state;
      let random;

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
        self.postMessage(reply);
        if (reply.terminate) close();
      }

      function initialize(d) {
        const baseUrl = d.href + d.amdCfg.baseUrl;
        self.importScripts(`${baseUrl}/require.js`);
        require.config(Object.assign({}, d.amdCfg, { baseUrl }));
        require(
            Object.assign({}, d.amdCfg, { baseUrl }),
            ['app/utilities', 'app/state'],
            ({ rnd }, State) => {
              random = rnd;
              state = new State();
            });
      }

      function init(e) {
        try {
          initialize(e.data);
          self.onmessage = handleMessage;
          self.postMessage({ init: true });
        } catch (err) {
          self.postMessage({ init: false, error: err.message });
        }
      }

      return init;
    })();
  }
);
