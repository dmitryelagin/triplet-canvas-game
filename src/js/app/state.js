// TODO Try to add depth for only win search
// TODO Refactor findWin, it is ugly
// TODO Ucomment exponentiation operator later
// Game state class
define(['./config', './player'], ({
    general: {
      rows, columns, emptyVal, maxTurns, signsPerRound, winLength,
      minTurnsForTie, maxLineLength, turnsPerRound,
    }, players }, Player) =>
  class State {

    constructor(source) {
      if (source instanceof this.constructor) {
        this.turn = source.turn;
        this.lastMove = source.lastMove;
        this.players = source.players;
        this.field = this.fillField((row, col) => source.field[row][col]);
        this.orders = source.orders;
      } else {
        this.turn = 0;
        this.lastMove = {};
        this.players = players.map((...args) => new Player(...args));
        this.field = this.fillField(() => emptyVal);
        this.orders = {
          normal: this.normalOrder.reverse(),
          spiral: this.spiralOrder.reverse(),
        };
      }
    }

    // Initialize methods
    fillField(filler) {
      const field = [];
      while (field.push([]) < rows) { /* Do nothing */ }
      for (let row = rows; row--;) {
        for (let col = columns; col--;) field[row][col] = filler(row, col);
      }
      return field;
    }

    get normalOrder() {
      return Array(maxTurns).fill(0).map((e, i) =>
          [~~(i / columns), i % columns]);
    }

    get spiralOrder() {
      const ORDER_SPIRAL_N_CCW = [[1, 0], [0, -1], [-1, 0], [0, 1]];
      const result = [];
      let vector;
      let [row, col] = [~~(rows / 2), ~~(columns / 2)];
      let [turns, straight, beforeTurn, searched] = [0, 0, 0, 0];
      while (searched < maxTurns) {
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
    }

    // General methods
    get copy() {
      return new State(this);
    }

    get currentPlayer() {
      return this.players[~~(this.turn / signsPerRound) %
          this.players.length];
    }

    cellInRange(row, col) {
      return row >= 0 && row < rows && col >= 0 && col < columns;
    }

    cellIsEmpty(row, col) {
      return this.field[row][col] === emptyVal;
    }

    makeMove(row, col) {
      if (this.cellIsEmpty(row, col) && this.cellInRange(row, col)) {
        this.lastMove = { row, col, player: this.currentPlayer };
        this.field[row][col] = this.lastMove.player.id;
        this.turn++;
        return this;
      }
      return null;
    }

    visitEmptyCells(order, fn) {
      let i = order.length;
      while (i--) {
        if (this.cellIsEmpty.apply(this, order[i]) &&
            fn.apply(this, order[i])) break;
      }
      return !!~i;
    }

    // Find win or tie methods
    findWin(method = 'map', codes = [this.lastMove.player.id, emptyVal],
        limits = [Infinity, 0],
        row = this.lastMove.row, col = this.lastMove.col) {
      const WINS_DIRECTIONS = [[0, 1], [1, 0], [-1, 1], [1, 1]];
      let remain;

      function getInlineCells(dirR, dirC, counter) {
        const seqRow = row + dirR * counter;
        const seqCol = col + dirC * counter;
        if (this.cellInRange(seqRow, seqCol)) {
          for (let i = 0; i < codes.length; i++) {
            if (this.field[seqRow][seqCol] === codes[i] && remain[i]-- > 0) {
              return getInlineCells.call(this, dirR, dirC, counter + 1);
            }
          }
        }
        return counter;
      }

      return WINS_DIRECTIONS[method](dir => {
        remain = limits.slice();
        const len0 = getInlineCells.call(this, dir[0], dir[1], 0);
        const len1 = getInlineCells.call(this, -dir[0], -dir[1], 1) - 1;
        return len0 + len1 < winLength ? null : {
          dir, codes, limits, remain, lengths: [len0, len1],
        };
      });
    }

    get isTie() {
      function somebodyCanWin(row, col) {
        return this.players.some(p => this.findWin('some', [p.id, emptyVal],
            [winLength, p.maxTurns - p.countTurns(this.turn)], row, col));
      }
      return !(this.turn < minTurnsForTie ||
          this.visitEmptyCells(this.orders.normal, somebodyCanWin));
    }

    // Simple heuristics
    scoreMoveHeuristic(scores = this.lastMove.player.ai.score) {
      const { row, col, player: { id: lastPlayerID } } = this.lastMove;
      let score = 0;
      let codes;

      // Long line should be scored higher than 4 short lines
      function scoreSignsAround() {
        const limits = [maxLineLength, Infinity];
        if (codes[0] !== lastPlayerID) {
          codes.push(lastPlayerID);
          limits.push(1);
        }
        return this.findWin('map', codes, limits, row, col).reduce((s, win) =>
          // (win ? s + 4 ** (maxLineLength - win.remain[0]) - 1 : s), 0);
          (win ? s + Math.pow(4, maxLineLength - win.remain[0]) - 1 : s), 0);
      }

      for (let i = 0; i < this.players.length; i++) {
        codes = [(lastPlayerID + i) % this.players.length, emptyVal];
        if (this.findWin('some', codes)) return scores.win * scores.sign[i];
        score += scoreSignsAround.call(this) * scores.sign[i];
      }
      if (this.isTie) return scores.tie;
      return score;
    }

    // NegaMax implementation with fail-soft alpha-beta pruning
    scoreMoveMinimax(maxPlayer = this.lastMove.player,
        a = -Infinity, b = Infinity, depth = maxPlayer.ai.depth) {
      const isMax = maxPlayer === this.currentPlayer;
      let alpha = a;
      let beta = b;

      function rateMove(row, col) {
        const score = this.copy.makeMove(row, col)
            .scoreMoveMinimax(maxPlayer, alpha, beta, depth - 1);
        if (isMax) alpha = Math.max(alpha, score);
        else beta = Math.min(beta, score);
        return alpha >= beta;
      }

      if (depth <= 0 || this.findWin('some') || this.isTie) {
        const sign = maxPlayer === this.lastMove.player ? 1 : -1;
        const speed = depth / turnsPerRound + 1;
        return this.scoreMoveHeuristic(maxPlayer.ai.score) * sign * speed;
      }
      this.visitEmptyCells(this.orders.spiral, rateMove);
      return isMax ? alpha : beta;
    }

    get nextBestMoves() {
      const scoreTypes = ['scoreMoveMinimax', 'scoreMoveHeuristic'];
      let moves = [];

      function rateCell(row, col) {
        const deep = this.copy.makeMove(row, col);
        moves.push({ row, col, score: scoreTypes.map(type => deep[type]()) });
      }

      this.visitEmptyCells(this.orders.normal, rateCell);
      for (let i = 0; i < scoreTypes.length; i++) {
        const max = Math.max(...moves.map(cell => cell.score[i]));
        moves = moves.filter(cell =>
            cell.score[i] >= max - this.currentPlayer.ai.tolerance);
      }
      return moves;
    }

  }
);
