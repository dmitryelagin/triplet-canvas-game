// TODO Try to add depth for only win search
// Game state class
import { general as cfg, players } from './config';
import Player from './player';

const ORDER_SPIRAL_N_CCW = [[1, 0], [0, -1], [-1, 0], [0, 1]];
const WINS_DIRECTIONS = [[0, 1], [1, 0], [-1, 1], [1, 1]];
const DEFAULT_LIMITS = [Infinity, 0];

export default class State {

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
      this.field = this.fillField(() => cfg.emptyVal);
      this.orders = {
        normal: this.normalOrder.reverse(),
        spiral: this.spiralOrder.reverse(),
      };
    }
  }

  // Initialize methods
  fillField(filler) {
    const field = [];
    while (field.push([]) < cfg.rows) { /* Do nothing */ }
    for (let row = cfg.rows; row--;) {
      for (let col = cfg.columns; col--;) field[row][col] = filler(row, col);
    }
    return field;
  }

  get normalOrder() {
    return Array(cfg.maxTurns).fill(0).map((e, i) =>
        [~~(i / cfg.columns), i % cfg.columns]);
  }

  get spiralOrder() {
    const result = [];
    let vector;
    let [row, col] = [~~(cfg.rows / 2), ~~(cfg.columns / 2)];
    let [turns, straight, beforeTurn, searched] = [0, 0, 0, 0];
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
  }

  // General methods
  get copy() {
    return new State(this);
  }

  get currentPlayer() {
    return this.players[~~(this.turn / cfg.signsPerRound) %
        this.players.length];
  }

  cellInRange(row, col) {
    return row >= 0 && row < cfg.rows && col >= 0 && col < cfg.columns;
  }

  cellIsEmpty(row, col) {
    return this.field[row][col] === cfg.emptyVal;
  }

  visitEmptyCells(order, fn) {
    for (var i = order.length; i--;)
      if (this.cellIsEmpty(...order[i]) && fn.apply(this, order[i]))
        return true;
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

  // Find win or tie methods
  findWin(method = 'map', codes = [this.lastMove.player.id, cfg.emptyVal],
      limits = DEFAULT_LIMITS,
      row = this.lastMove.row, col = this.lastMove.col) {
    const remainLim = limits.slice();

    function getInlineCells(dirR, dirC, counter) {
      const nextRow = row + dirR * counter;
      const nextCol = col + dirC * counter;
      if (this.cellInRange(nextRow, nextCol)) {
        for (let i = 0; i < codes.length; i++) {
          if (this.field[nextRow][nextCol] === codes[i] && remainLim[i]-- > 0) {
            return getInlineCells.call(this, dirR, dirC, counter + 1);
          }
        }
      }
      return counter;
    }

    return WINS_DIRECTIONS[method](dir => {
      const len0 = getInlineCells.call(this, dir[0], dir[1], 0);
      const len1 = getInlineCells.call(this, -dir[0], -dir[1], 1) - 1;
      return len0 + len1 < cfg.winLength ? null : {
        dir, codes, limits, remainLim, lengths: [len0, len1],
      };
    });
  }

  get isTie() {
    function somebodyCanWin(...cell) {
      return this.players.some(p => this.findWin('some', [p.id, cfg.emptyVal],
          [cfg.winLength, p.maxTurns - p.countTurns(this.turn)], ...cell));
    }
    return !(this.turn < cfg.minTurnsForTie ||
        this.visitEmptyCells(this.orders.normal, somebodyCanWin));
  }

  // Simple heuristics
  scoreMoveHeuristic(scores = this.lastMove.player.ai.score) {
    const { row, col, player: { id: lastPlayerID } } = this.lastMove;
    let score = 0;
    let codes;

    // Long line should be scored higher than 4 short lines
    function scoreSignsAround() {
      const limits = [cfg.maxLineLength, Infinity];
      if (codes[0] !== lastPlayerID) {
        codes.push(lastPlayerID);
        limits.push(1);
      }
      return this.findWin('map', codes, limits, row, col).reduce((scr, win) =>
        (win ? scr + 4 ** (cfg.maxLineLength - win.remainLim[0]) - 1 : scr), 0);
    }

    for (let i = 0; i < this.players.length; i++) {
      codes = [(lastPlayerID + i) % this.players.length, cfg.emptyVal];
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
      const speed = depth / cfg.turnsPerRound + 1;
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
