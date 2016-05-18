// TODO Try to add depth for only win search
// TODO Maybe add players externally
// Game state class
TRIPLET.State = (function() {

var cfg = TRIPLET.config.general,
    rule = TRIPLET.config.rules,
    players = TRIPLET.config.players,
    Player = TRIPLET.Player,
    State;

State = function(source) {
  if (source instanceof State) {
    this.turn = source.turn;
    this.lastMove = source.lastMove;
    this.players = source.players;
    this.field = this.fill(function(i, j) {
      return source.field[i][j];
    });
  } else {
    this.turn = 0;
    this.lastMove = {};
    this.players = players.map(Player);
    this.field = this.fill(function() {
      return rule.emptyVal;
    });
  }
};

State.prototype = {

  constructor: TRIPLET.State,

  // Initialize methods
  fill: function(filler) {
    var i, j, field = [];
    for (i = cfg.rows; i--;) {
      field[i] = [];
      for (j = cfg.columns; j--;) field[i][j] = filler(i, j);
    }
    return field;
  },

  // General methods
  getCurrentPlayer: function() {
    return this.players[~~(this.turn / rule.signsPerRound) %
        this.players.length];
  },

  cellInRange: function(row, col) {
    return row >= 0 && row < cfg.rows && col >= 0 && col < cfg.columns;
  },

  copy: function() {
    return new State(this);
  },

  makeMove: function(row, col) {
    if (this.field[row][col] !== rule.emptyVal || !this.cellInRange(row, col))
      return false;
    this.lastMove = {
      row: row,
      col: col,
      player: this.getCurrentPlayer()
    };
    this.field[row][col] = this.lastMove.player.queue;
    this.turn++;
    return true;
  },

  visitEmptyCellsBySpiral: (function() {

    var SEARCH_DIRECTIONS = [[1, 0], [0, -1], [-1, 0], [0, 1]];

    return function(callback) {
      var startRow = ~~(cfg.rows / 2),
          startCol = ~~(cfg.columns / 2),
          maxDir = [startRow, startCol, startRow, startCol],
          cell = [startRow, startCol],
          changeDir = 0,
          searchedCells = 0,
          vector, direction, shift, result;
      while (searchedCells < cfg.maxTurns) {
        vector = changeDir % 4;
        direction = changeDir++ % 2;
        shift = SEARCH_DIRECTIONS[vector][direction];
        do {
          if (this.cellInRange(cell[0], cell[1])) {
            if (this.field[cell[0]][cell[1]] === rule.emptyVal) {
              result = callback.call(this, cell[0], cell[1]);
              if (result !== undefined) return result;
            }
            searchedCells++;
          }
          cell[direction] += shift;
        } while (cell[direction] * shift <= maxDir[vector] * shift);
        maxDir[vector] += shift;
      }
    };

  })(),

  // REFACTOR too many .call()
  // Find win or tie methods
  findWin: (function() {

    var LINES_DIRECTIONS = [[0, 1], [1, 0], [-1, 1], [1, 1]],
        DEFAULT_LIMITS = [Infinity, 0];

    return function(method, codes, limits, moveRow, moveCol) {

      function getInlineCells(lim, dirX, dirY, counter) {
        var row = moveRow + dirX * counter,
            col = moveCol + dirY * counter,
            i;
        if (this.cellInRange(row, col))
          for (i = 0; i < codes.length; i++)
            if (this.field[row][col] === codes[i] && lim[i] && lim[i]-- > 0)
              return getInlineCells.call(this, lim, dirX, dirY, counter + 1);
        return counter;
      }

      function getWinLine(dir) {
        var lim = limits.slice(),
            part0 = getInlineCells.call(this, lim, dir[0], dir[1], 0),
            part1 = getInlineCells.call(this, lim, -dir[0], -dir[1], 1) - 1;
        if (part0 + part1 >= rule.winLength)
          return [codes, limits, lim, part0, part1, dir];
      }

      function validateInput() {
        if (!(method in Array.prototype)) method = 'map';
        if (codes === undefined) codes = this.lastMove.player.queue;
        if (!Array.isArray(limits)) limits = DEFAULT_LIMITS;
        if (!this.cellInRange(moveRow, moveCol)) {
          moveRow = this.lastMove.row;
          moveCol = this.lastMove.col;
        }
      }

      if (arguments.length < 5) validateInput.call(this);
      if (typeof codes !== 'object' || !Array.isArray(codes))
        codes = [codes, rule.emptyVal];
      return LINES_DIRECTIONS[method](getWinLine, this);

    };

  })(),

  isTie: function() {
    var i, j;
    function playerCanWin(plr) {
      var remains = plr.maxTurns - plr.getTurnsCount(this.turn);
      return this.findWin('some', plr.queue, [rule.winLength, remains], i, j);
    }
    for (i = cfg.rows; i--;)
      for (j = cfg.columns; j--;)
        if (this.field[i][j] === rule.emptyVal)
          return !this.players.some(playerCanWin, this);
  },

  // Simple heuristics
  getMoveHeuristicScore: function(scores) {

    var score = 0,
        lastPlayerID = this.lastMove.player.queue,
        i, j, playerID;

    function scoreSignsAround() {
      var probableWins = this.findWin(
          'map',
          [playerID, rule.emptyVal, lastPlayerID],
          [cfg.maxLineLength, Infinity, playerID === lastPlayerID ? 0 : 1],
          this.lastMove.row,
          this.lastMove.col);
      // Longer line should be scored higher than four shorter lines
      return probableWins.filter(function(val) {
        return val !== undefined;
      }).reduce(function(result, val) {
        return result + Math.pow(4, cfg.maxLineLength - val[2][0]) - 1;
      }, 0);
    }

    function multiplyer(i) {
      switch (i) {
      case 0: return scores.sign.own;
      case 1: return scores.sign.mainEnemy;
      default: return scores.sign.enemy;
      }
    }

    scores = scores || this.lastMove.player.ai.score;
    for (i = 0, j = this.players.length; i < j; i++) {
      playerID = (lastPlayerID + i) % j;
      if (this.findWin('some', playerID)) return scores.win * multiplyer(i);
      score += scoreSignsAround.call(this) * multiplyer(i);
    }
    if (this.isTie()) return scores.tie;
    return score;

  },

  // NegaMax implementation with fail-soft alpha-beta pruning
  getMoveMinimaxScore: function(maxPlayer, alpha, beta, depth) {

    var isMax = maxPlayer === this.getCurrentPlayer();

    function prepareFirstCall() {
      maxPlayer = this.lastMove.player;
      alpha = -Infinity;
      beta = Infinity;
      depth = maxPlayer.ai.depth;
    }

    function moveAndScore(row, col) {
      var deepState, score;
      deepState = this.copy();
      deepState.makeMove(row, col);
      score = deepState.getMoveMinimaxScore(maxPlayer, alpha, beta, depth - 1);
      if (isMax) alpha = Math.max(alpha, score);
      else beta = Math.min(beta, score);
      if (alpha >= beta) return true;
    }

    if (arguments.length < 4) prepareFirstCall();
    if (depth <= 0 || this.findWin('some') || this.isTie())
      return this.getMoveHeuristicScore(maxPlayer.ai.score) *
          (maxPlayer === this.lastMove.player ? 1 : -1) *
          (depth / rule.turnsPerRound + 1);
    this.visitEmptyCellsBySpiral(moveAndScore);
    return isMax ? alpha : beta;

  }

};

return State;

})();
