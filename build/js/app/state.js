'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Try to add depth to minimax for only win search
// TODO Refactor findWin, it is ugly
// TODO Ucomment exponentiation operator later
// TODO Implement Monte-Carlo tree search algorythm
// Game state class
define(['./config', './player'], function (_ref, Player) {
  var _ref$general = _ref.general;
  var rows = _ref$general.rows;
  var columns = _ref$general.columns;
  var emptyVal = _ref$general.emptyVal;
  var maxTurns = _ref$general.maxTurns;
  var signsPerRound = _ref$general.signsPerRound;
  var winLength = _ref$general.winLength;
  var minTurnsForTie = _ref$general.minTurnsForTie;
  var maxLineLength = _ref$general.maxLineLength;
  var turnsPerRound = _ref$general.turnsPerRound;
  var players = _ref.players;
  return function () {
    function State(source) {
      _classCallCheck(this, State);

      if (source instanceof this.constructor) {
        this.turn = source.turn;
        this.lastMove = source.lastMove;
        this.players = source.players;
        this.field = this.fillField(function (row, col) {
          return source.field[row][col];
        });
        this.orders = source.orders;
      } else {
        this.turn = 0;
        this.lastMove = {};
        this.players = players.map(function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return new (Function.prototype.bind.apply(Player, [null].concat(args)))();
        });
        this.field = this.fillField(function () {
          return emptyVal;
        });
        this.orders = {
          normal: this.normalOrder.reverse(),
          spiral: this.spiralOrder.reverse()
        };
      }
    }

    // Initialize methods


    _createClass(State, [{
      key: 'fillField',
      value: function fillField(filler) {
        var field = [];
        while (field.push([]) < rows) {/* Do nothing */}
        for (var row = rows; row--;) {
          for (var col = columns; col--;) {
            field[row][col] = filler(row, col);
          }
        }
        return field;
      }
    }, {
      key: 'cellInRange',
      value: function cellInRange(row, col) {
        return row >= 0 && row < rows && col >= 0 && col < columns;
      }
    }, {
      key: 'cellIsEmpty',
      value: function cellIsEmpty(row, col) {
        return this.field[row][col] === emptyVal;
      }
    }, {
      key: 'makeMove',
      value: function makeMove(row, col) {
        if (this.cellIsEmpty(row, col) && this.cellInRange(row, col)) {
          this.lastMove = { row: row, col: col, player: this.currentPlayer };
          this.field[row][col] = this.lastMove.player.id;
          this.turn++;
          return this;
        }
        return null;
      }
    }, {
      key: 'visitEmptyCells',
      value: function visitEmptyCells(order, fn) {
        var i = order.length;
        while (i--) {
          if (this.cellIsEmpty.apply(this, order[i]) && fn.apply(this, order[i])) break;
        }
        return !! ~i;
      }

      // Find win or tie methods

    }, {
      key: 'findWin',
      value: function findWin() {
        var method = arguments.length <= 0 || arguments[0] === undefined ? 'map' : arguments[0];
        var codes = arguments.length <= 1 || arguments[1] === undefined ? [this.lastMove.player.id, emptyVal] : arguments[1];
        var limits = arguments.length <= 2 || arguments[2] === undefined ? [Infinity, 0] : arguments[2];

        var _this = this;

        var row = arguments.length <= 3 || arguments[3] === undefined ? this.lastMove.row : arguments[3];
        var col = arguments.length <= 4 || arguments[4] === undefined ? this.lastMove.col : arguments[4];

        var WINS_DIRECTIONS = [[0, 1], [1, 0], [-1, 1], [1, 1]];
        var remain = void 0;

        var getInlineCells = function getInlineCells(dirR, dirC, counter) {
          var seqRow = row + dirR * counter;
          var seqCol = col + dirC * counter;
          if (_this.cellInRange(seqRow, seqCol)) {
            for (var i = 0; i < codes.length; i++) {
              if (_this.field[seqRow][seqCol] === codes[i] && remain[i]-- > 0) {
                return getInlineCells(dirR, dirC, counter + 1);
              }
            }
          }
          return counter;
        };

        return WINS_DIRECTIONS[method](function (dir) {
          remain = limits.slice();
          var len0 = getInlineCells(dir[0], dir[1], 0);
          var len1 = getInlineCells(-dir[0], -dir[1], 1) - 1;
          return len0 + len1 < winLength ? null : {
            dir: dir, codes: codes, limits: limits, remain: remain, lengths: [len0, len1]
          };
        });
      }
    }, {
      key: 'scoreMoveHeuristic',


      // Simple heuristics
      value: function scoreMoveHeuristic() {
        var scores = arguments.length <= 0 || arguments[0] === undefined ? this.lastMove.player.ai.score : arguments[0];
        var _lastMove = this.lastMove;
        var row = _lastMove.row;
        var col = _lastMove.col;
        var lastPlayerID = _lastMove.player.id;

        var score = 0;
        var codes = void 0;

        // Long line should be scored higher than 4 short lines
        function scoreSignsAround() {
          var limits = [maxLineLength, Infinity];
          if (codes[0] !== lastPlayerID) {
            codes.push(lastPlayerID);
            limits.push(1);
          }
          return this.findWin('map', codes, limits, row, col).reduce(function (s, win) {
            return(
              // (win ? s + 4 ** (maxLineLength - win.remain[0]) - 1 : s), 0);
              win ? s + Math.pow(4, maxLineLength - win.remain[0]) - 1 : s
            );
          }, 0);
        }

        for (var i = 0; i < this.players.length; i++) {
          codes = [(lastPlayerID + i) % this.players.length, emptyVal];
          if (this.findWin('some', codes)) return scores.win * scores.sign[i];
          score += scoreSignsAround.call(this) * scores.sign[i];
        }
        if (this.isTie) return scores.tie;
        return score;
      }

      // NegaMax implementation with fail-soft alpha-beta pruning

    }, {
      key: 'scoreMoveMinimax',
      value: function scoreMoveMinimax() {
        var maxPlayer = arguments.length <= 0 || arguments[0] === undefined ? this.lastMove.player : arguments[0];
        var a = arguments.length <= 1 || arguments[1] === undefined ? -Infinity : arguments[1];
        var b = arguments.length <= 2 || arguments[2] === undefined ? Infinity : arguments[2];
        var depth = arguments.length <= 3 || arguments[3] === undefined ? maxPlayer.ai.depth : arguments[3];

        var isMax = maxPlayer === this.currentPlayer;
        var alpha = a;
        var beta = b;

        function rateMove(row, col) {
          var score = this.copy.makeMove(row, col).scoreMoveMinimax(maxPlayer, alpha, beta, depth - 1);
          if (isMax) alpha = Math.max(alpha, score);else beta = Math.min(beta, score);
          return alpha >= beta;
        }

        if (depth <= 0 || this.findWin('some') || this.isTie) {
          var sign = maxPlayer === this.lastMove.player ? 1 : -1;
          var speed = depth / turnsPerRound + 1;
          return this.scoreMoveHeuristic(maxPlayer.ai.score) * sign * speed;
        }
        this.visitEmptyCells(this.orders.spiral, rateMove);
        return isMax ? alpha : beta;
      }
    }, {
      key: 'normalOrder',
      get: function get() {
        return Array(maxTurns).fill(0).map(function (e, i) {
          return [~ ~(i / columns), i % columns];
        });
      }
    }, {
      key: 'spiralOrder',
      get: function get() {
        var ORDER_SPIRAL_N_CCW = [[1, 0], [0, -1], [-1, 0], [0, 1]];
        var result = [];
        var row = ~ ~(rows / 2);
        var col = ~ ~(columns / 2);
        var turns = 0;
        var straight = 0;
        var beforeTurn = 0;

        while (result.length < maxTurns) {
          if (this.cellInRange(row, col)) result.push([row, col]);
          var vector = turns % 4;
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

    }, {
      key: 'copy',
      get: function get() {
        return new State(this);
      }
    }, {
      key: 'currentPlayer',
      get: function get() {
        return this.players[~ ~(this.turn / signsPerRound) % this.players.length];
      }
    }, {
      key: 'isTie',
      get: function get() {
        function somebodyCanWin(row, col) {
          var _this2 = this;

          return this.players.some(function (p) {
            return _this2.findWin('some', [p.id, emptyVal], [winLength, p.maxTurns - p.countTurns(_this2.turn)], row, col);
          });
        }
        return !(this.turn < minTurnsForTie || this.visitEmptyCells(this.orders.normal, somebodyCanWin));
      }
    }, {
      key: 'nextBestMoves',
      get: function get() {
        var _this3 = this;

        var scoreTypes = ['scoreMoveMinimax', 'scoreMoveHeuristic'];
        var moves = [];

        function rateCell(row, col) {
          var deep = this.copy.makeMove(row, col);
          moves.push({ row: row, col: col, score: scoreTypes.map(function (type) {
              return deep[type]();
            }) });
        }

        this.visitEmptyCells(this.orders.normal, rateCell);

        var _loop = function _loop(i) {
          var max = Math.max.apply(Math, _toConsumableArray(moves.map(function (cell) {
            return cell.score[i];
          })));
          moves = moves.filter(function (cell) {
            return cell.score[i] >= max - _this3.currentPlayer.ai.tolerance;
          });
        };

        for (var i = 0; i < scoreTypes.length; i++) {
          _loop(i);
        }
        return moves;
      }
    }]);

    return State;
  }();
});
//# sourceMappingURL=data:application/json;base64,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Q0FBVSxRQUFWLENBQW1CLEdBQW5CLEVBQXdCLEdBQXhCLENBQWI7QUFDQSxnQkFBTSxJQUFOLENBQVcsRUFBRSxRQUFGLEVBQU8sUUFBUCxFQUFZLE9BQU8sV0FBVyxHQUFYLENBQWU7QUFBQSxxQkFBUSxLQUFLLElBQUwsR0FBUjtBQUFBLGFBQWYsQ0FBbkIsRUFBWDtBQUNEOztBQUVELGFBQUssZUFBTCxDQUFxQixLQUFLLE1BQUwsQ0FBWSxNQUFqQyxFQUF5QyxRQUF6Qzs7QUFUa0IsbUNBVVQsQ0FWUztBQVdoQixjQUFNLE1BQU0sS0FBSyxHQUFMLGdDQUFZLE1BQU0sR0FBTixDQUFVO0FBQUEsbUJBQVEsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFSO0FBQUEsV0FBVixDQUFaLEVBQVo7QUFDQSxrQkFBUSxNQUFNLE1BQU4sQ0FBYTtBQUFBLG1CQUNqQixLQUFLLEtBQUwsQ0FBVyxDQUFYLEtBQWlCLE1BQU0sT0FBSyxhQUFMLENBQW1CLEVBQW5CLENBQXNCLFNBRDVCO0FBQUEsV0FBYixDQUFSO0FBWmdCOztBQVVsQixhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksV0FBVyxNQUEvQixFQUF1QyxHQUF2QyxFQUE0QztBQUFBLGdCQUFuQyxDQUFtQztBQUkzQztBQUNELGVBQU8sS0FBUDtBQUNEO0FBM000Qjs7QUFBQTtBQUFBO0FBQUEsQ0FBakMiLCJmaWxlIjoianMvYXBwL3N0YXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETyBUcnkgdG8gYWRkIGRlcHRoIHRvIG1pbmltYXggZm9yIG9ubHkgd2luIHNlYXJjaFxyXG4vLyBUT0RPIFJlZmFjdG9yIGZpbmRXaW4sIGl0IGlzIHVnbHlcclxuLy8gVE9ETyBVY29tbWVudCBleHBvbmVudGlhdGlvbiBvcGVyYXRvciBsYXRlclxyXG4vLyBUT0RPIEltcGxlbWVudCBNb250ZS1DYXJsbyB0cmVlIHNlYXJjaCBhbGdvcnl0aG1cclxuLy8gR2FtZSBzdGF0ZSBjbGFzc1xyXG5kZWZpbmUoWycuL2NvbmZpZycsICcuL3BsYXllciddLCAoe1xyXG4gICAgZ2VuZXJhbDoge1xyXG4gICAgICByb3dzLCBjb2x1bW5zLCBlbXB0eVZhbCwgbWF4VHVybnMsIHNpZ25zUGVyUm91bmQsIHdpbkxlbmd0aCxcclxuICAgICAgbWluVHVybnNGb3JUaWUsIG1heExpbmVMZW5ndGgsIHR1cm5zUGVyUm91bmQsXHJcbiAgICB9LCBwbGF5ZXJzIH0sIFBsYXllcikgPT5cclxuICBjbGFzcyBTdGF0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc291cmNlKSB7XHJcbiAgICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgdGhpcy50dXJuID0gc291cmNlLnR1cm47XHJcbiAgICAgICAgdGhpcy5sYXN0TW92ZSA9IHNvdXJjZS5sYXN0TW92ZTtcclxuICAgICAgICB0aGlzLnBsYXllcnMgPSBzb3VyY2UucGxheWVycztcclxuICAgICAgICB0aGlzLmZpZWxkID0gdGhpcy5maWxsRmllbGQoKHJvdywgY29sKSA9PiBzb3VyY2UuZmllbGRbcm93XVtjb2xdKTtcclxuICAgICAgICB0aGlzLm9yZGVycyA9IHNvdXJjZS5vcmRlcnM7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy50dXJuID0gMDtcclxuICAgICAgICB0aGlzLmxhc3RNb3ZlID0ge307XHJcbiAgICAgICAgdGhpcy5wbGF5ZXJzID0gcGxheWVycy5tYXAoKC4uLmFyZ3MpID0+IG5ldyBQbGF5ZXIoLi4uYXJncykpO1xyXG4gICAgICAgIHRoaXMuZmllbGQgPSB0aGlzLmZpbGxGaWVsZCgoKSA9PiBlbXB0eVZhbCk7XHJcbiAgICAgICAgdGhpcy5vcmRlcnMgPSB7XHJcbiAgICAgICAgICBub3JtYWw6IHRoaXMubm9ybWFsT3JkZXIucmV2ZXJzZSgpLFxyXG4gICAgICAgICAgc3BpcmFsOiB0aGlzLnNwaXJhbE9yZGVyLnJldmVyc2UoKSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSBtZXRob2RzXHJcbiAgICBmaWxsRmllbGQoZmlsbGVyKSB7XHJcbiAgICAgIGNvbnN0IGZpZWxkID0gW107XHJcbiAgICAgIHdoaWxlIChmaWVsZC5wdXNoKFtdKSA8IHJvd3MpIHsgLyogRG8gbm90aGluZyAqLyB9XHJcbiAgICAgIGZvciAobGV0IHJvdyA9IHJvd3M7IHJvdy0tOykge1xyXG4gICAgICAgIGZvciAobGV0IGNvbCA9IGNvbHVtbnM7IGNvbC0tOykgZmllbGRbcm93XVtjb2xdID0gZmlsbGVyKHJvdywgY29sKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmllbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG5vcm1hbE9yZGVyKCkge1xyXG4gICAgICByZXR1cm4gQXJyYXkobWF4VHVybnMpLmZpbGwoMCkubWFwKChlLCBpKSA9PlxyXG4gICAgICAgICAgW35+KGkgLyBjb2x1bW5zKSwgaSAlIGNvbHVtbnNdKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc3BpcmFsT3JkZXIoKSB7XHJcbiAgICAgIGNvbnN0IE9SREVSX1NQSVJBTF9OX0NDVyA9IFtbMSwgMF0sIFswLCAtMV0sIFstMSwgMF0sIFswLCAxXV07XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgICBsZXQgW3JvdywgY29sXSA9IFt+fihyb3dzIC8gMiksIH5+KGNvbHVtbnMgLyAyKV07XHJcbiAgICAgIGxldCBbdHVybnMsIHN0cmFpZ2h0LCBiZWZvcmVUdXJuXSA9IFswLCAwLCAwXTtcclxuICAgICAgd2hpbGUgKHJlc3VsdC5sZW5ndGggPCBtYXhUdXJucykge1xyXG4gICAgICAgIGlmICh0aGlzLmNlbGxJblJhbmdlKHJvdywgY29sKSkgcmVzdWx0LnB1c2goW3JvdywgY29sXSk7XHJcbiAgICAgICAgY29uc3QgdmVjdG9yID0gdHVybnMgJSA0O1xyXG4gICAgICAgIHJvdyArPSBPUkRFUl9TUElSQUxfTl9DQ1dbdmVjdG9yXVswXTtcclxuICAgICAgICBjb2wgKz0gT1JERVJfU1BJUkFMX05fQ0NXW3ZlY3Rvcl1bMV07XHJcbiAgICAgICAgaWYgKGJlZm9yZVR1cm4tLSA9PT0gMCkge1xyXG4gICAgICAgICAgdHVybnMrKztcclxuICAgICAgICAgIGJlZm9yZVR1cm4gPSBzdHJhaWdodDtcclxuICAgICAgICAgIGlmICh2ZWN0b3IgJSAyID09PSAwKSBzdHJhaWdodCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdlbmVyYWwgbWV0aG9kc1xyXG4gICAgZ2V0IGNvcHkoKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU3RhdGUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGN1cnJlbnRQbGF5ZXIoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnBsYXllcnNbfn4odGhpcy50dXJuIC8gc2lnbnNQZXJSb3VuZCkgJVxyXG4gICAgICAgICAgdGhpcy5wbGF5ZXJzLmxlbmd0aF07XHJcbiAgICB9XHJcblxyXG4gICAgY2VsbEluUmFuZ2Uocm93LCBjb2wpIHtcclxuICAgICAgcmV0dXJuIHJvdyA+PSAwICYmIHJvdyA8IHJvd3MgJiYgY29sID49IDAgJiYgY29sIDwgY29sdW1ucztcclxuICAgIH1cclxuXHJcbiAgICBjZWxsSXNFbXB0eShyb3csIGNvbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5maWVsZFtyb3ddW2NvbF0gPT09IGVtcHR5VmFsO1xyXG4gICAgfVxyXG5cclxuICAgIG1ha2VNb3ZlKHJvdywgY29sKSB7XHJcbiAgICAgIGlmICh0aGlzLmNlbGxJc0VtcHR5KHJvdywgY29sKSAmJiB0aGlzLmNlbGxJblJhbmdlKHJvdywgY29sKSkge1xyXG4gICAgICAgIHRoaXMubGFzdE1vdmUgPSB7IHJvdywgY29sLCBwbGF5ZXI6IHRoaXMuY3VycmVudFBsYXllciB9O1xyXG4gICAgICAgIHRoaXMuZmllbGRbcm93XVtjb2xdID0gdGhpcy5sYXN0TW92ZS5wbGF5ZXIuaWQ7XHJcbiAgICAgICAgdGhpcy50dXJuKys7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmlzaXRFbXB0eUNlbGxzKG9yZGVyLCBmbikge1xyXG4gICAgICBsZXQgaSA9IG9yZGVyLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgIGlmICh0aGlzLmNlbGxJc0VtcHR5LmFwcGx5KHRoaXMsIG9yZGVyW2ldKSAmJlxyXG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBvcmRlcltpXSkpIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAhIX5pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpbmQgd2luIG9yIHRpZSBtZXRob2RzXHJcbiAgICBmaW5kV2luKG1ldGhvZCA9ICdtYXAnLFxyXG4gICAgICAgIGNvZGVzID0gW3RoaXMubGFzdE1vdmUucGxheWVyLmlkLCBlbXB0eVZhbF0sIGxpbWl0cyA9IFtJbmZpbml0eSwgMF0sXHJcbiAgICAgICAgcm93ID0gdGhpcy5sYXN0TW92ZS5yb3csIGNvbCA9IHRoaXMubGFzdE1vdmUuY29sKSB7XHJcbiAgICAgIGNvbnN0IFdJTlNfRElSRUNUSU9OUyA9IFtbMCwgMV0sIFsxLCAwXSwgWy0xLCAxXSwgWzEsIDFdXTtcclxuICAgICAgbGV0IHJlbWFpbjtcclxuXHJcbiAgICAgIGNvbnN0IGdldElubGluZUNlbGxzID0gKGRpclIsIGRpckMsIGNvdW50ZXIpID0+IHtcclxuICAgICAgICBjb25zdCBzZXFSb3cgPSByb3cgKyBkaXJSICogY291bnRlcjtcclxuICAgICAgICBjb25zdCBzZXFDb2wgPSBjb2wgKyBkaXJDICogY291bnRlcjtcclxuICAgICAgICBpZiAodGhpcy5jZWxsSW5SYW5nZShzZXFSb3csIHNlcUNvbCkpIHtcclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZmllbGRbc2VxUm93XVtzZXFDb2xdID09PSBjb2Rlc1tpXSAmJiByZW1haW5baV0tLSA+IDApIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZ2V0SW5saW5lQ2VsbHMoZGlyUiwgZGlyQywgY291bnRlciArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb3VudGVyO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIFdJTlNfRElSRUNUSU9OU1ttZXRob2RdKGRpciA9PiB7XHJcbiAgICAgICAgcmVtYWluID0gbGltaXRzLnNsaWNlKCk7XHJcbiAgICAgICAgY29uc3QgbGVuMCA9IGdldElubGluZUNlbGxzKGRpclswXSwgZGlyWzFdLCAwKTtcclxuICAgICAgICBjb25zdCBsZW4xID0gZ2V0SW5saW5lQ2VsbHMoLWRpclswXSwgLWRpclsxXSwgMSkgLSAxO1xyXG4gICAgICAgIHJldHVybiBsZW4wICsgbGVuMSA8IHdpbkxlbmd0aCA/IG51bGwgOiB7XHJcbiAgICAgICAgICBkaXIsIGNvZGVzLCBsaW1pdHMsIHJlbWFpbiwgbGVuZ3RoczogW2xlbjAsIGxlbjFdLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpc1RpZSgpIHtcclxuICAgICAgZnVuY3Rpb24gc29tZWJvZHlDYW5XaW4ocm93LCBjb2wpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wbGF5ZXJzLnNvbWUocCA9PiB0aGlzLmZpbmRXaW4oJ3NvbWUnLCBbcC5pZCwgZW1wdHlWYWxdLFxyXG4gICAgICAgICAgICBbd2luTGVuZ3RoLCBwLm1heFR1cm5zIC0gcC5jb3VudFR1cm5zKHRoaXMudHVybildLCByb3csIGNvbCkpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAhKHRoaXMudHVybiA8IG1pblR1cm5zRm9yVGllIHx8XHJcbiAgICAgICAgICB0aGlzLnZpc2l0RW1wdHlDZWxscyh0aGlzLm9yZGVycy5ub3JtYWwsIHNvbWVib2R5Q2FuV2luKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2ltcGxlIGhldXJpc3RpY3NcclxuICAgIHNjb3JlTW92ZUhldXJpc3RpYyhzY29yZXMgPSB0aGlzLmxhc3RNb3ZlLnBsYXllci5haS5zY29yZSkge1xyXG4gICAgICBjb25zdCB7IHJvdywgY29sLCBwbGF5ZXI6IHsgaWQ6IGxhc3RQbGF5ZXJJRCB9IH0gPSB0aGlzLmxhc3RNb3ZlO1xyXG4gICAgICBsZXQgc2NvcmUgPSAwO1xyXG4gICAgICBsZXQgY29kZXM7XHJcblxyXG4gICAgICAvLyBMb25nIGxpbmUgc2hvdWxkIGJlIHNjb3JlZCBoaWdoZXIgdGhhbiA0IHNob3J0IGxpbmVzXHJcbiAgICAgIGZ1bmN0aW9uIHNjb3JlU2lnbnNBcm91bmQoKSB7XHJcbiAgICAgICAgY29uc3QgbGltaXRzID0gW21heExpbmVMZW5ndGgsIEluZmluaXR5XTtcclxuICAgICAgICBpZiAoY29kZXNbMF0gIT09IGxhc3RQbGF5ZXJJRCkge1xyXG4gICAgICAgICAgY29kZXMucHVzaChsYXN0UGxheWVySUQpO1xyXG4gICAgICAgICAgbGltaXRzLnB1c2goMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRXaW4oJ21hcCcsIGNvZGVzLCBsaW1pdHMsIHJvdywgY29sKS5yZWR1Y2UoKHMsIHdpbikgPT5cclxuICAgICAgICAgIC8vICh3aW4gPyBzICsgNCAqKiAobWF4TGluZUxlbmd0aCAtIHdpbi5yZW1haW5bMF0pIC0gMSA6IHMpLCAwKTtcclxuICAgICAgICAgICh3aW4gPyBzICsgTWF0aC5wb3coNCwgbWF4TGluZUxlbmd0aCAtIHdpbi5yZW1haW5bMF0pIC0gMSA6IHMpLCAwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb2RlcyA9IFsobGFzdFBsYXllcklEICsgaSkgJSB0aGlzLnBsYXllcnMubGVuZ3RoLCBlbXB0eVZhbF07XHJcbiAgICAgICAgaWYgKHRoaXMuZmluZFdpbignc29tZScsIGNvZGVzKSkgcmV0dXJuIHNjb3Jlcy53aW4gKiBzY29yZXMuc2lnbltpXTtcclxuICAgICAgICBzY29yZSArPSBzY29yZVNpZ25zQXJvdW5kLmNhbGwodGhpcykgKiBzY29yZXMuc2lnbltpXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5pc1RpZSkgcmV0dXJuIHNjb3Jlcy50aWU7XHJcbiAgICAgIHJldHVybiBzY29yZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOZWdhTWF4IGltcGxlbWVudGF0aW9uIHdpdGggZmFpbC1zb2Z0IGFscGhhLWJldGEgcHJ1bmluZ1xyXG4gICAgc2NvcmVNb3ZlTWluaW1heChtYXhQbGF5ZXIgPSB0aGlzLmxhc3RNb3ZlLnBsYXllcixcclxuICAgICAgICBhID0gLUluZmluaXR5LCBiID0gSW5maW5pdHksIGRlcHRoID0gbWF4UGxheWVyLmFpLmRlcHRoKSB7XHJcbiAgICAgIGNvbnN0IGlzTWF4ID0gbWF4UGxheWVyID09PSB0aGlzLmN1cnJlbnRQbGF5ZXI7XHJcbiAgICAgIGxldCBhbHBoYSA9IGE7XHJcbiAgICAgIGxldCBiZXRhID0gYjtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHJhdGVNb3ZlKHJvdywgY29sKSB7XHJcbiAgICAgICAgY29uc3Qgc2NvcmUgPSB0aGlzLmNvcHkubWFrZU1vdmUocm93LCBjb2wpXHJcbiAgICAgICAgICAgIC5zY29yZU1vdmVNaW5pbWF4KG1heFBsYXllciwgYWxwaGEsIGJldGEsIGRlcHRoIC0gMSk7XHJcbiAgICAgICAgaWYgKGlzTWF4KSBhbHBoYSA9IE1hdGgubWF4KGFscGhhLCBzY29yZSk7XHJcbiAgICAgICAgZWxzZSBiZXRhID0gTWF0aC5taW4oYmV0YSwgc2NvcmUpO1xyXG4gICAgICAgIHJldHVybiBhbHBoYSA+PSBiZXRhO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGVwdGggPD0gMCB8fCB0aGlzLmZpbmRXaW4oJ3NvbWUnKSB8fCB0aGlzLmlzVGllKSB7XHJcbiAgICAgICAgY29uc3Qgc2lnbiA9IG1heFBsYXllciA9PT0gdGhpcy5sYXN0TW92ZS5wbGF5ZXIgPyAxIDogLTE7XHJcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBkZXB0aCAvIHR1cm5zUGVyUm91bmQgKyAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjb3JlTW92ZUhldXJpc3RpYyhtYXhQbGF5ZXIuYWkuc2NvcmUpICogc2lnbiAqIHNwZWVkO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudmlzaXRFbXB0eUNlbGxzKHRoaXMub3JkZXJzLnNwaXJhbCwgcmF0ZU1vdmUpO1xyXG4gICAgICByZXR1cm4gaXNNYXggPyBhbHBoYSA6IGJldGE7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG5leHRCZXN0TW92ZXMoKSB7XHJcbiAgICAgIGNvbnN0IHNjb3JlVHlwZXMgPSBbJ3Njb3JlTW92ZU1pbmltYXgnLCAnc2NvcmVNb3ZlSGV1cmlzdGljJ107XHJcbiAgICAgIGxldCBtb3ZlcyA9IFtdO1xyXG5cclxuICAgICAgZnVuY3Rpb24gcmF0ZUNlbGwocm93LCBjb2wpIHtcclxuICAgICAgICBjb25zdCBkZWVwID0gdGhpcy5jb3B5Lm1ha2VNb3ZlKHJvdywgY29sKTtcclxuICAgICAgICBtb3Zlcy5wdXNoKHsgcm93LCBjb2wsIHNjb3JlOiBzY29yZVR5cGVzLm1hcCh0eXBlID0+IGRlZXBbdHlwZV0oKSkgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMudmlzaXRFbXB0eUNlbGxzKHRoaXMub3JkZXJzLm5vcm1hbCwgcmF0ZUNlbGwpO1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjb3JlVHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi5tb3Zlcy5tYXAoY2VsbCA9PiBjZWxsLnNjb3JlW2ldKSk7XHJcbiAgICAgICAgbW92ZXMgPSBtb3Zlcy5maWx0ZXIoY2VsbCA9PlxyXG4gICAgICAgICAgICBjZWxsLnNjb3JlW2ldID49IG1heCAtIHRoaXMuY3VycmVudFBsYXllci5haS50b2xlcmFuY2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBtb3ZlcztcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
