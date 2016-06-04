// TODO Try to add depth for only win search
// TODO Maybe add players externally
// TODO Return win from findWin method as object instead of array
// TODO Optimize minimax to be more effective
// TODO Make all other orders
// TODO Refactor findNextBestMoves method for new makeMove returns
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
    this.field = this.fill(function(i, j) {
      return source.field[i][j];
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
    var i, j, field = [];
    for (i = cfg.rows; i--;) {
      field[i] = [];
      for (j = cfg.columns; j--;) field[i][j] = filler(i, j);
    }
    return field;
  },

  makeNormalOrder: function() {
    var row, col, result = [];
    for (row = 0; row < cfg.rows; row++)
      for (col = 0; col < cfg.columns; col++)
        result.push([row, col]);
    return result;
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
    var i;
    filter = filter || function() { return true; };
    for (i = order.length; i--;)
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
            nextCol = col + dirC * counter,
            i;
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
        if (len0 + len1 >= rule.winLength)
          return [codes, limits, lim, len0, len1, dir];
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
    scores = scores || this.lastMove.player.ai.score;

    function scoreSignsAround() {
      var codes = [playerID, rule.emptyVal, lastPlayerID],
          limits = [cfg.maxLineLength, Infinity, 1],
          probableWins;
      if (playerID === lastPlayerID) limits[2] = 0;
      probableWins = this.findWin(
          'map', codes, limits, this.lastMove.row, this.lastMove.col);
      return probableWins.reduce(function(score, val) {
        if (val) score += Math.pow(4, cfg.maxLineLength - val[2][0]) - 1;
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

    var scores = getEmptyCellsScores(this),
        tolerance = this.getCurrentPlayer().ai.tolerance,
        priority = ['minimax', 'heuristic'];

    function getEmptyCellsScores(self) {
      return self.field.reduce(function(result, row, i) {
        return result.concat(row.map(function(cell, j) {
          var deepState = self.copy();
          if (deepState.makeMove(i, j)) return {
            row: i, col: j,
            minimax: deepState.getMoveMinimaxScore(),
            heuristic: deepState.getMoveHeuristicScore()
          };
        }));
      }, []).filter(function(val) { return val; });
    }

    function maxOfProperties(prop) {
      return Math.max.apply(null, scores.map(function(obj) {
        return obj[prop];
      }));
    }

    priority.forEach(function(prop) {
      var max = maxOfProperties(prop) - tolerance;
      scores = scores.filter(function(val) { return val[prop] >= max; });
    });
    return scores;

  }

};

return State;

})();
