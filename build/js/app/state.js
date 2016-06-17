'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Try to add depth for only win search
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
      key: 'visitEmptyCells',
      value: function visitEmptyCells(order, fn) {
        for (var i = order.length; i--;) {
          if (this.cellIsEmpty.apply(this, _toConsumableArray(order[i])) && fn.apply(this, order[i])) {
            return true;
          }
        }
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

        var winsDirections = [[0, 1], [1, 0], [-1, 1], [1, 1]];
        var remainLim = limits.slice();

        function getInlineCells(dirR, dirC, counter) {
          var nextRow = row + dirR * counter;
          var nextCol = col + dirC * counter;
          if (this.cellInRange(nextRow, nextCol)) {
            for (var i = 0; i < codes.length; i++) {
              if (this.field[nextRow][nextCol] === codes[i] && remainLim[i]-- > 0) {
                return getInlineCells.call(this, dirR, dirC, counter + 1);
              }
            }
          }
          return counter;
        }

        return winsDirections[method](function (dir) {
          var len0 = getInlineCells.call(_this, dir[0], dir[1], 0);
          var len1 = getInlineCells.call(_this, -dir[0], -dir[1], 1) - 1;
          return len0 + len1 < winLength ? null : {
            dir: dir, codes: codes, limits: limits, remainLim: remainLim, lengths: [len0, len1]
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
            return win ? s + Math.pow(4, maxLineLength - win.remainLim[0]) - 1 : s;
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
        var orderSpiralNCCW = [[1, 0], [0, -1], [-1, 0], [0, 1]];
        var result = [];
        var vector = void 0;
        var row = ~ ~(rows / 2);
        var col = ~ ~(columns / 2);
        var turns = 0;
        var straight = 0;
        var beforeTurn = 0;
        var searched = 0;

        while (searched < maxTurns) {
          if (this.cellInRange(row, col)) {
            result.push([row, col]);
            searched++;
          }
          vector = turns % 4;
          row += orderSpiralNCCW[vector][0];
          col += orderSpiralNCCW[vector][1];
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
        function somebodyCanWin() {
          var _this2 = this;

          for (var _len2 = arguments.length, cell = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            cell[_key2] = arguments[_key2];
          }

          return this.players.some(function (p) {
            return _this2.findWin.apply(_this2, ['some', [p.id, emptyVal], [winLength, p.maxTurns - p.countTurns(_this2.turn)]].concat(cell));
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
//# sourceMappingURL=data:application/json;base64,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QU0sT0FBTyxLQUFLLElBQUwsQ0FBVSxRQUFWLENBQW1CLEdBQW5CLEVBQXdCLEdBQXhCLENBQWI7QUFDQSxnQkFBTSxJQUFOLENBQVcsRUFBRSxRQUFGLEVBQU8sUUFBUCxFQUFZLE9BQU8sV0FBVyxHQUFYLENBQWU7QUFBQSxxQkFBUSxLQUFLLElBQUwsR0FBUjtBQUFBLGFBQWYsQ0FBbkIsRUFBWDtBQUNEOztBQUVELGFBQUssZUFBTCxDQUFxQixLQUFLLE1BQUwsQ0FBWSxNQUFqQyxFQUF5QyxRQUF6Qzs7QUFUa0IsbUNBVVQsQ0FWUztBQVdoQixjQUFNLE1BQU0sS0FBSyxHQUFMLGdDQUFZLE1BQU0sR0FBTixDQUFVO0FBQUEsbUJBQVEsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFSO0FBQUEsV0FBVixDQUFaLEVBQVo7QUFDQSxrQkFBUSxNQUFNLE1BQU4sQ0FBYTtBQUFBLG1CQUNqQixLQUFLLEtBQUwsQ0FBVyxDQUFYLEtBQWlCLE1BQU0sT0FBSyxhQUFMLENBQW1CLEVBQW5CLENBQXNCLFNBRDVCO0FBQUEsV0FBYixDQUFSO0FBWmdCOztBQVVsQixhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksV0FBVyxNQUEvQixFQUF1QyxHQUF2QyxFQUE0QztBQUFBLGdCQUFuQyxDQUFtQztBQUkzQztBQUNELGVBQU8sS0FBUDtBQUNEO0FBN000Qjs7QUFBQTtBQUFBO0FBQUEsQ0FBakMiLCJmaWxlIjoianMvYXBwL3N0YXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETyBUcnkgdG8gYWRkIGRlcHRoIGZvciBvbmx5IHdpbiBzZWFyY2hcclxuLy8gR2FtZSBzdGF0ZSBjbGFzc1xyXG5kZWZpbmUoWycuL2NvbmZpZycsICcuL3BsYXllciddLCAoe1xyXG4gICAgZ2VuZXJhbDoge1xyXG4gICAgICByb3dzLCBjb2x1bW5zLCBlbXB0eVZhbCwgbWF4VHVybnMsIHNpZ25zUGVyUm91bmQsIHdpbkxlbmd0aCxcclxuICAgICAgbWluVHVybnNGb3JUaWUsIG1heExpbmVMZW5ndGgsIHR1cm5zUGVyUm91bmQsXHJcbiAgICB9LCBwbGF5ZXJzIH0sIFBsYXllcikgPT5cclxuICBjbGFzcyBTdGF0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc291cmNlKSB7XHJcbiAgICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgdGhpcy50dXJuID0gc291cmNlLnR1cm47XHJcbiAgICAgICAgdGhpcy5sYXN0TW92ZSA9IHNvdXJjZS5sYXN0TW92ZTtcclxuICAgICAgICB0aGlzLnBsYXllcnMgPSBzb3VyY2UucGxheWVycztcclxuICAgICAgICB0aGlzLmZpZWxkID0gdGhpcy5maWxsRmllbGQoKHJvdywgY29sKSA9PiBzb3VyY2UuZmllbGRbcm93XVtjb2xdKTtcclxuICAgICAgICB0aGlzLm9yZGVycyA9IHNvdXJjZS5vcmRlcnM7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy50dXJuID0gMDtcclxuICAgICAgICB0aGlzLmxhc3RNb3ZlID0ge307XHJcbiAgICAgICAgdGhpcy5wbGF5ZXJzID0gcGxheWVycy5tYXAoKC4uLmFyZ3MpID0+IG5ldyBQbGF5ZXIoLi4uYXJncykpO1xyXG4gICAgICAgIHRoaXMuZmllbGQgPSB0aGlzLmZpbGxGaWVsZCgoKSA9PiBlbXB0eVZhbCk7XHJcbiAgICAgICAgdGhpcy5vcmRlcnMgPSB7XHJcbiAgICAgICAgICBub3JtYWw6IHRoaXMubm9ybWFsT3JkZXIucmV2ZXJzZSgpLFxyXG4gICAgICAgICAgc3BpcmFsOiB0aGlzLnNwaXJhbE9yZGVyLnJldmVyc2UoKSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSBtZXRob2RzXHJcbiAgICBmaWxsRmllbGQoZmlsbGVyKSB7XHJcbiAgICAgIGNvbnN0IGZpZWxkID0gW107XHJcbiAgICAgIHdoaWxlIChmaWVsZC5wdXNoKFtdKSA8IHJvd3MpIHsgLyogRG8gbm90aGluZyAqLyB9XHJcbiAgICAgIGZvciAobGV0IHJvdyA9IHJvd3M7IHJvdy0tOykge1xyXG4gICAgICAgIGZvciAobGV0IGNvbCA9IGNvbHVtbnM7IGNvbC0tOykgZmllbGRbcm93XVtjb2xdID0gZmlsbGVyKHJvdywgY29sKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmllbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG5vcm1hbE9yZGVyKCkge1xyXG4gICAgICByZXR1cm4gQXJyYXkobWF4VHVybnMpLmZpbGwoMCkubWFwKChlLCBpKSA9PlxyXG4gICAgICAgICAgW35+KGkgLyBjb2x1bW5zKSwgaSAlIGNvbHVtbnNdKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc3BpcmFsT3JkZXIoKSB7XHJcbiAgICAgIGNvbnN0IG9yZGVyU3BpcmFsTkNDVyA9IFtbMSwgMF0sIFswLCAtMV0sIFstMSwgMF0sIFswLCAxXV07XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgICBsZXQgdmVjdG9yO1xyXG4gICAgICBsZXQgW3JvdywgY29sXSA9IFt+fihyb3dzIC8gMiksIH5+KGNvbHVtbnMgLyAyKV07XHJcbiAgICAgIGxldCBbdHVybnMsIHN0cmFpZ2h0LCBiZWZvcmVUdXJuLCBzZWFyY2hlZF0gPSBbMCwgMCwgMCwgMF07XHJcbiAgICAgIHdoaWxlIChzZWFyY2hlZCA8IG1heFR1cm5zKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2VsbEluUmFuZ2Uocm93LCBjb2wpKSB7XHJcbiAgICAgICAgICByZXN1bHQucHVzaChbcm93LCBjb2xdKTtcclxuICAgICAgICAgIHNlYXJjaGVkKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZlY3RvciA9IHR1cm5zICUgNDtcclxuICAgICAgICByb3cgKz0gb3JkZXJTcGlyYWxOQ0NXW3ZlY3Rvcl1bMF07XHJcbiAgICAgICAgY29sICs9IG9yZGVyU3BpcmFsTkNDV1t2ZWN0b3JdWzFdO1xyXG4gICAgICAgIGlmIChiZWZvcmVUdXJuLS0gPT09IDApIHtcclxuICAgICAgICAgIHR1cm5zKys7XHJcbiAgICAgICAgICBiZWZvcmVUdXJuID0gc3RyYWlnaHQ7XHJcbiAgICAgICAgICBpZiAodmVjdG9yICUgMiA9PT0gMCkgc3RyYWlnaHQrKztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZW5lcmFsIG1ldGhvZHNcclxuICAgIGdldCBjb3B5KCkge1xyXG4gICAgICByZXR1cm4gbmV3IFN0YXRlKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjdXJyZW50UGxheWVyKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXJzW35+KHRoaXMudHVybiAvIHNpZ25zUGVyUm91bmQpICVcclxuICAgICAgICAgIHRoaXMucGxheWVycy5sZW5ndGhdO1xyXG4gICAgfVxyXG5cclxuICAgIGNlbGxJblJhbmdlKHJvdywgY29sKSB7XHJcbiAgICAgIHJldHVybiByb3cgPj0gMCAmJiByb3cgPCByb3dzICYmIGNvbCA+PSAwICYmIGNvbCA8IGNvbHVtbnM7XHJcbiAgICB9XHJcblxyXG4gICAgY2VsbElzRW1wdHkocm93LCBjb2wpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZmllbGRbcm93XVtjb2xdID09PSBlbXB0eVZhbDtcclxuICAgIH1cclxuXHJcbiAgICB2aXNpdEVtcHR5Q2VsbHMob3JkZXIsIGZuKSB7XHJcbiAgICAgIGZvciAobGV0IGkgPSBvcmRlci5sZW5ndGg7IGktLTspIHtcclxuICAgICAgICBpZiAodGhpcy5jZWxsSXNFbXB0eSguLi5vcmRlcltpXSkgJiYgZm4uYXBwbHkodGhpcywgb3JkZXJbaV0pKSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtYWtlTW92ZShyb3csIGNvbCkge1xyXG4gICAgICBpZiAodGhpcy5jZWxsSXNFbXB0eShyb3csIGNvbCkgJiYgdGhpcy5jZWxsSW5SYW5nZShyb3csIGNvbCkpIHtcclxuICAgICAgICB0aGlzLmxhc3RNb3ZlID0geyByb3csIGNvbCwgcGxheWVyOiB0aGlzLmN1cnJlbnRQbGF5ZXIgfTtcclxuICAgICAgICB0aGlzLmZpZWxkW3Jvd11bY29sXSA9IHRoaXMubGFzdE1vdmUucGxheWVyLmlkO1xyXG4gICAgICAgIHRoaXMudHVybisrO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpbmQgd2luIG9yIHRpZSBtZXRob2RzXHJcbiAgICBmaW5kV2luKG1ldGhvZCA9ICdtYXAnLCBjb2RlcyA9IFt0aGlzLmxhc3RNb3ZlLnBsYXllci5pZCwgZW1wdHlWYWxdLFxyXG4gICAgICAgIGxpbWl0cyA9IFtJbmZpbml0eSwgMF0sXHJcbiAgICAgICAgcm93ID0gdGhpcy5sYXN0TW92ZS5yb3csIGNvbCA9IHRoaXMubGFzdE1vdmUuY29sKSB7XHJcbiAgICAgIGNvbnN0IHdpbnNEaXJlY3Rpb25zID0gW1swLCAxXSwgWzEsIDBdLCBbLTEsIDFdLCBbMSwgMV1dO1xyXG4gICAgICBjb25zdCByZW1haW5MaW0gPSBsaW1pdHMuc2xpY2UoKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGdldElubGluZUNlbGxzKGRpclIsIGRpckMsIGNvdW50ZXIpIHtcclxuICAgICAgICBjb25zdCBuZXh0Um93ID0gcm93ICsgZGlyUiAqIGNvdW50ZXI7XHJcbiAgICAgICAgY29uc3QgbmV4dENvbCA9IGNvbCArIGRpckMgKiBjb3VudGVyO1xyXG4gICAgICAgIGlmICh0aGlzLmNlbGxJblJhbmdlKG5leHRSb3csIG5leHRDb2wpKSB7XHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmZpZWxkW25leHRSb3ddW25leHRDb2xdID09PSBjb2Rlc1tpXSAmJlxyXG4gICAgICAgICAgICAgICAgcmVtYWluTGltW2ldLS0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGdldElubGluZUNlbGxzLmNhbGwodGhpcywgZGlyUiwgZGlyQywgY291bnRlciArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb3VudGVyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gd2luc0RpcmVjdGlvbnNbbWV0aG9kXShkaXIgPT4ge1xyXG4gICAgICAgIGNvbnN0IGxlbjAgPSBnZXRJbmxpbmVDZWxscy5jYWxsKHRoaXMsIGRpclswXSwgZGlyWzFdLCAwKTtcclxuICAgICAgICBjb25zdCBsZW4xID0gZ2V0SW5saW5lQ2VsbHMuY2FsbCh0aGlzLCAtZGlyWzBdLCAtZGlyWzFdLCAxKSAtIDE7XHJcbiAgICAgICAgcmV0dXJuIGxlbjAgKyBsZW4xIDwgd2luTGVuZ3RoID8gbnVsbCA6IHtcclxuICAgICAgICAgIGRpciwgY29kZXMsIGxpbWl0cywgcmVtYWluTGltLCBsZW5ndGhzOiBbbGVuMCwgbGVuMV0sXHJcbiAgICAgICAgfTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGlzVGllKCkge1xyXG4gICAgICBmdW5jdGlvbiBzb21lYm9keUNhbldpbiguLi5jZWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGxheWVycy5zb21lKHAgPT4gdGhpcy5maW5kV2luKCdzb21lJywgW3AuaWQsIGVtcHR5VmFsXSxcclxuICAgICAgICAgICAgW3dpbkxlbmd0aCwgcC5tYXhUdXJucyAtIHAuY291bnRUdXJucyh0aGlzLnR1cm4pXSwgLi4uY2VsbCkpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAhKHRoaXMudHVybiA8IG1pblR1cm5zRm9yVGllIHx8XHJcbiAgICAgICAgICB0aGlzLnZpc2l0RW1wdHlDZWxscyh0aGlzLm9yZGVycy5ub3JtYWwsIHNvbWVib2R5Q2FuV2luKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2ltcGxlIGhldXJpc3RpY3NcclxuICAgIHNjb3JlTW92ZUhldXJpc3RpYyhzY29yZXMgPSB0aGlzLmxhc3RNb3ZlLnBsYXllci5haS5zY29yZSkge1xyXG4gICAgICBjb25zdCB7IHJvdywgY29sLCBwbGF5ZXI6IHsgaWQ6IGxhc3RQbGF5ZXJJRCB9IH0gPSB0aGlzLmxhc3RNb3ZlO1xyXG4gICAgICBsZXQgc2NvcmUgPSAwO1xyXG4gICAgICBsZXQgY29kZXM7XHJcblxyXG4gICAgICAvLyBMb25nIGxpbmUgc2hvdWxkIGJlIHNjb3JlZCBoaWdoZXIgdGhhbiA0IHNob3J0IGxpbmVzXHJcbiAgICAgIGZ1bmN0aW9uIHNjb3JlU2lnbnNBcm91bmQoKSB7XHJcbiAgICAgICAgY29uc3QgbGltaXRzID0gW21heExpbmVMZW5ndGgsIEluZmluaXR5XTtcclxuICAgICAgICBpZiAoY29kZXNbMF0gIT09IGxhc3RQbGF5ZXJJRCkge1xyXG4gICAgICAgICAgY29kZXMucHVzaChsYXN0UGxheWVySUQpO1xyXG4gICAgICAgICAgbGltaXRzLnB1c2goMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRXaW4oJ21hcCcsIGNvZGVzLCBsaW1pdHMsIHJvdywgY29sKS5yZWR1Y2UoKHMsIHdpbikgPT5cclxuICAgICAgICAgICh3aW4gPyBzICsgNCAqKiAobWF4TGluZUxlbmd0aCAtIHdpbi5yZW1haW5MaW1bMF0pIC0gMSA6IHMpLCAwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb2RlcyA9IFsobGFzdFBsYXllcklEICsgaSkgJSB0aGlzLnBsYXllcnMubGVuZ3RoLCBlbXB0eVZhbF07XHJcbiAgICAgICAgaWYgKHRoaXMuZmluZFdpbignc29tZScsIGNvZGVzKSkgcmV0dXJuIHNjb3Jlcy53aW4gKiBzY29yZXMuc2lnbltpXTtcclxuICAgICAgICBzY29yZSArPSBzY29yZVNpZ25zQXJvdW5kLmNhbGwodGhpcykgKiBzY29yZXMuc2lnbltpXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5pc1RpZSkgcmV0dXJuIHNjb3Jlcy50aWU7XHJcbiAgICAgIHJldHVybiBzY29yZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOZWdhTWF4IGltcGxlbWVudGF0aW9uIHdpdGggZmFpbC1zb2Z0IGFscGhhLWJldGEgcHJ1bmluZ1xyXG4gICAgc2NvcmVNb3ZlTWluaW1heChtYXhQbGF5ZXIgPSB0aGlzLmxhc3RNb3ZlLnBsYXllcixcclxuICAgICAgICBhID0gLUluZmluaXR5LCBiID0gSW5maW5pdHksIGRlcHRoID0gbWF4UGxheWVyLmFpLmRlcHRoKSB7XHJcbiAgICAgIGNvbnN0IGlzTWF4ID0gbWF4UGxheWVyID09PSB0aGlzLmN1cnJlbnRQbGF5ZXI7XHJcbiAgICAgIGxldCBhbHBoYSA9IGE7XHJcbiAgICAgIGxldCBiZXRhID0gYjtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHJhdGVNb3ZlKHJvdywgY29sKSB7XHJcbiAgICAgICAgY29uc3Qgc2NvcmUgPSB0aGlzLmNvcHkubWFrZU1vdmUocm93LCBjb2wpXHJcbiAgICAgICAgICAgIC5zY29yZU1vdmVNaW5pbWF4KG1heFBsYXllciwgYWxwaGEsIGJldGEsIGRlcHRoIC0gMSk7XHJcbiAgICAgICAgaWYgKGlzTWF4KSBhbHBoYSA9IE1hdGgubWF4KGFscGhhLCBzY29yZSk7XHJcbiAgICAgICAgZWxzZSBiZXRhID0gTWF0aC5taW4oYmV0YSwgc2NvcmUpO1xyXG4gICAgICAgIHJldHVybiBhbHBoYSA+PSBiZXRhO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGVwdGggPD0gMCB8fCB0aGlzLmZpbmRXaW4oJ3NvbWUnKSB8fCB0aGlzLmlzVGllKSB7XHJcbiAgICAgICAgY29uc3Qgc2lnbiA9IG1heFBsYXllciA9PT0gdGhpcy5sYXN0TW92ZS5wbGF5ZXIgPyAxIDogLTE7XHJcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBkZXB0aCAvIHR1cm5zUGVyUm91bmQgKyAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjb3JlTW92ZUhldXJpc3RpYyhtYXhQbGF5ZXIuYWkuc2NvcmUpICogc2lnbiAqIHNwZWVkO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudmlzaXRFbXB0eUNlbGxzKHRoaXMub3JkZXJzLnNwaXJhbCwgcmF0ZU1vdmUpO1xyXG4gICAgICByZXR1cm4gaXNNYXggPyBhbHBoYSA6IGJldGE7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG5leHRCZXN0TW92ZXMoKSB7XHJcbiAgICAgIGNvbnN0IHNjb3JlVHlwZXMgPSBbJ3Njb3JlTW92ZU1pbmltYXgnLCAnc2NvcmVNb3ZlSGV1cmlzdGljJ107XHJcbiAgICAgIGxldCBtb3ZlcyA9IFtdO1xyXG5cclxuICAgICAgZnVuY3Rpb24gcmF0ZUNlbGwocm93LCBjb2wpIHtcclxuICAgICAgICBjb25zdCBkZWVwID0gdGhpcy5jb3B5Lm1ha2VNb3ZlKHJvdywgY29sKTtcclxuICAgICAgICBtb3Zlcy5wdXNoKHsgcm93LCBjb2wsIHNjb3JlOiBzY29yZVR5cGVzLm1hcCh0eXBlID0+IGRlZXBbdHlwZV0oKSkgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMudmlzaXRFbXB0eUNlbGxzKHRoaXMub3JkZXJzLm5vcm1hbCwgcmF0ZUNlbGwpO1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjb3JlVHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi5tb3Zlcy5tYXAoY2VsbCA9PiBjZWxsLnNjb3JlW2ldKSk7XHJcbiAgICAgICAgbW92ZXMgPSBtb3Zlcy5maWx0ZXIoY2VsbCA9PlxyXG4gICAgICAgICAgICBjZWxsLnNjb3JlW2ldID49IG1heCAtIHRoaXMuY3VycmVudFBsYXllci5haS50b2xlcmFuY2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBtb3ZlcztcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
