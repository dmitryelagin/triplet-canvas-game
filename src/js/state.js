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
    this.orders = source.orders;
    this.field = this.fill(function(row, col) {
      return source.field[row][col];
    });
  } else {
    this.turn = 0;
    this.lastMove = {};
    this.players = players.map(Player);
    this.orders = {
      normal: this.makeNormalOrder().reverse(),
      spiral: this.makeSpiralOrder().reverse()
    };
    this.field = this.fill(function() {
      return rule.emptyVal;
    });
  }
};

State.prototype = {

  constructor: TRIPLET.State,

  // Initialize methods
  fill: function(filler) {
    var row, col, field = [];
    while (field.push([]) <= cfg.rows) {}
    for (row = cfg.rows; row--;)
      for (col = cfg.columns; col--;)
        field[row][col] = filler(row, col);
    return field;
  },

  makeNormalOrder: function() {
    function getRowCol(e, i) { return [~~(i / cfg.columns), i % cfg.columns]; }
    return Array.apply(null, Array(cfg.maxTurns)).map(getRowCol);
  },

  makeSpiralOrder: (function() {

    var ORDER_SPIRAL_N_CCW = [[1, 0], [0, -1], [-1, 0], [0, 1]];

    return function() {
      var row = ~~(cfg.rows / 2),
          col = ~~(cfg.columns / 2),
          result = [],
          vector,
          turns = 0, straight = 0, beforeTurn = 0, searched = 0;
      while (searched < cfg.maxTurns) {
        if (this.cellInRange(row, col)) {
          result.push([row, col]);
          searched++;
        }
        vector = turns % 4;
        row += ORDER_SPIRAL_N_CCW[vector][0];
        col += ORDER_SPIRAL_N_CCW[vector][1];
        if (beforeTurn-- === 0) {
          turns++;
          beforeTurn = straight;
          if (vector % 2 === 0) straight++;
        }
      }
      return result;
    };

  })(),

  // General methods
  copy: function() {
    return new State(this);
  },

  getCurrentPlayer: function() {
    return this.players[~~(this.turn / rule.signsPerRound) %
        this.players.length];
  },

  cellInRange: function(row, col) {
    return row >= 0 && row < cfg.rows && col >= 0 && col < cfg.columns;
  },

  cellIsEmpty: function(row, col) {
    return this.field[row][col] === rule.emptyVal;
  },

  visitCells: function(order, fn, filter) {
    for (var i = order.length; i--;)
      if (filter.apply(this, order[i]) && fn.apply(this, order[i])) return true;
  },

  makeMove: function(row, col) {
    if (this.cellIsEmpty(row, col) && this.cellInRange(row, col)) {
      this.lastMove = {
        row: row, col: col,
        player: this.getCurrentPlayer()
      };
      this.field[row][col] = this.lastMove.player.queue;
      this.turn++;
      return this;
    }
  },

  // Find win or tie methods
  findWin: (function() {

    var DIRECTIONS = [[0, 1], [1, 0], [-1, 1], [1, 1]],
        DEFAULT_LIMITS = [Infinity, 0];

    return function(method, codes, limits, row, col) {

      function getInlineCells(lim, dirR, dirC, counter) {
        var nextRow = row + dirR * counter,
            nextCol = col + dirC * counter, i;
        if (this.cellInRange(nextRow, nextCol))
          for (i = 0; i < codes.length; i++)
            if (this.field[nextRow][nextCol] === codes[i] && lim[i]-- > 0)
              return getInlineCells.call(this, lim, dirR, dirC, counter + 1);
        return counter;
      }

      function getWinLine(dir) {
        var lim = limits.slice(),
            len0 = getInlineCells.call(this, lim, dir[0], dir[1], 0),
            len1 = getInlineCells.call(this, lim, -dir[0], -dir[1], 1) - 1;
        if (len0 + len1 >= rule.winLength) return {
          codes: codes, limits: limits, remainLim: lim,
          lengths: [len0, len1], direction: dir
        };
      }

      if (method !== 'map' && method !== 'some') method = 'map';
      if (!Array.isArray(codes))
        codes = [this.lastMove.player.queue, rule.emptyVal];
      if (!Array.isArray(limits)) limits = DEFAULT_LIMITS;
      if (!this.cellInRange(row, col)) {
        row = this.lastMove.row;
        col = this.lastMove.col;
      }
      if (codes.length === limits.length)
        return DIRECTIONS[method](getWinLine, this);
      throw new Error('Wrong findWin method initialization.');

    };

  })(),

  isTie: function() {
    function somebodyCanWin(row, col) {
      return this.players.some(function canWin(player) {
        var remains = player.maxTurns - player.getTurnsCount(this.turn);
        return this.findWin('some',
            [player.queue, rule.emptyVal], [rule.winLength, remains], row, col);
      }, this);
    }
    return !(this.turn < rule.turnsForTie ||
        this.visitCells(this.orders.normal, somebodyCanWin, this.cellIsEmpty));
  },

  // Simple heuristics
  getMoveHeuristicScore: function(scores) {

    var score = 0,
        lastPlayerID = this.lastMove.player.queue,
        playersCount = this.players.length,
        i, playerID;

    function scoreSignsAround() {
      var codes = [playerID, rule.emptyVal, lastPlayerID],
          limits = [cfg.maxLineLength, Infinity, 1],
          probableWins;
      if (playerID === lastPlayerID) limits[2] = 0;
      probableWins = this.findWin(
          'map', codes, limits, this.lastMove.row, this.lastMove.col);
      return probableWins.reduce(function(score, win) {
        if (win) score += Math.pow(4, cfg.maxLineLength - win.remainLim[0]) - 1;
        return score;
      }, 0);  // Long line should be scored higher than 4 short lines
    }

    function ratio(i) {
      switch (i) {
      case 0: return scores.sign.own;
      case 1: return scores.sign.mainEnemy;
      default: return scores.sign.enemy;
      }
    }

    scores = scores || this.lastMove.player.ai.score;
    for (i = 0; i < playersCount; i++) {
      playerID = (lastPlayerID + i) % playersCount;
      if (this.findWin('some', [playerID, rule.emptyVal]))
        return scores.win * ratio(i);
      score += scoreSignsAround.call(this) * ratio(i);
    }
    if (this.isTie()) return scores.tie;
    return score;

  },

  // NegaMax implementation with fail-soft alpha-beta pruning
  getMoveMinimaxScore: function(maxPlayer, alpha, beta, depth) {

    var isMax = maxPlayer === this.getCurrentPlayer();

    function prepare() {
      maxPlayer = this.lastMove.player;
      alpha = -Infinity;
      beta = Infinity;
      depth = maxPlayer.ai.depth;
    }

    function rateMove(row, col) {
      var score = this.copy().makeMove(row, col).getMoveMinimaxScore(
          maxPlayer, alpha, beta, depth - 1);
      if (isMax) alpha = Math.max(alpha, score);
      else beta = Math.min(beta, score);
      return alpha >= beta;
    }

    if (arguments.length < 4) prepare.call(this);
    if (depth <= 0 || this.findWin('some') || this.isTie())
      return this.getMoveHeuristicScore(maxPlayer.ai.score) *
          (maxPlayer === this.lastMove.player ? 1 : -1) *
          (depth / rule.turnsPerRound + 1);
    this.visitCells(this.orders.spiral, rateMove, this.cellIsEmpty);
    return isMax ? alpha : beta;

  },

  findNextBestMoves: function() {

    var i, scoreTypes = 0,
        scores = [],
        tolerance = this.getCurrentPlayer().ai.tolerance;

    function findHighScore(i) {
      var max = Math.max.apply(null, scores.map(function(o) {
        return o.score[i];
      })) - tolerance;
      return scores.filter(function(val) { return val.score[i] >= max; });
    }

    function rateCell(row, col) {
      var deep = this.copy().makeMove(row, col),
          score = [deep.getMoveMinimaxScore(), deep.getMoveHeuristicScore()];
      if (!scoreTypes) scoreTypes = score.length;
      scores.push({ row: row, col: col, score: score });
    }

    this.visitCells(this.orders.normal, rateCell, this.cellIsEmpty);
    for (i = 0; i < scoreTypes; i++) scores = findHighScore(i);
    return scores;

  }

};

return State;

})();
