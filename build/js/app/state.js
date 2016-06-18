'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Try to add depth for only win search
// TODO Refactor findWin, it is ugly
// TODO Ucomment exponentiation operator later
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

        var winsDirections = [[0, 1], [1, 0], [-1, 1], [1, 1]];
        var remain = void 0;

        function getInlineCells(dirR, dirC, counter) {
          var seqRow = row + dirR * counter;
          var seqCol = col + dirC * counter;
          if (this.cellInRange(seqRow, seqCol)) {
            for (var i = 0; i < codes.length; i++) {
              if (this.field[seqRow][seqCol] === codes[i] && remain[i]-- > 0) {
                return getInlineCells.call(this, dirR, dirC, counter + 1);
              }
            }
          }
          return counter;
        }

        return winsDirections[method](function (dir) {
          remain = limits.slice();
          var len0 = getInlineCells.call(_this, dir[0], dir[1], 0);
          var len1 = getInlineCells.call(_this, -dir[0], -dir[1], 1) - 1;
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
//# sourceMappingURL=data:application/json;base64,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USxFQUFaOztBQUVBLGlCQUFTLFFBQVQsQ0FBa0IsR0FBbEIsRUFBdUIsR0FBdkIsRUFBNEI7QUFDMUIsY0FBTSxPQUFPLEtBQUssSUFBTCxDQUFVLFFBQVYsQ0FBbUIsR0FBbkIsRUFBd0IsR0FBeEIsQ0FBYjtBQUNBLGdCQUFNLElBQU4sQ0FBVyxFQUFFLFFBQUYsRUFBTyxRQUFQLEVBQVksT0FBTyxXQUFXLEdBQVgsQ0FBZTtBQUFBLHFCQUFRLEtBQUssSUFBTCxHQUFSO0FBQUEsYUFBZixDQUFuQixFQUFYO0FBQ0Q7O0FBRUQsYUFBSyxlQUFMLENBQXFCLEtBQUssTUFBTCxDQUFZLE1BQWpDLEVBQXlDLFFBQXpDOztBQVRrQixtQ0FVVCxDQVZTO0FBV2hCLGNBQU0sTUFBTSxLQUFLLEdBQUwsZ0NBQVksTUFBTSxHQUFOLENBQVU7QUFBQSxtQkFBUSxLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQVI7QUFBQSxXQUFWLENBQVosRUFBWjtBQUNBLGtCQUFRLE1BQU0sTUFBTixDQUFhO0FBQUEsbUJBQ2pCLEtBQUssS0FBTCxDQUFXLENBQVgsS0FBaUIsTUFBTSxPQUFLLGFBQUwsQ0FBbUIsRUFBbkIsQ0FBc0IsU0FENUI7QUFBQSxXQUFiLENBQVI7QUFaZ0I7O0FBVWxCLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxXQUFXLE1BQS9CLEVBQXVDLEdBQXZDLEVBQTRDO0FBQUEsZ0JBQW5DLENBQW1DO0FBSTNDO0FBQ0QsZUFBTyxLQUFQO0FBQ0Q7QUEvTTRCOztBQUFBO0FBQUE7QUFBQSxDQUFqQyIsImZpbGUiOiJqcy9hcHAvc3RhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIFRyeSB0byBhZGQgZGVwdGggZm9yIG9ubHkgd2luIHNlYXJjaFxyXG4vLyBUT0RPIFJlZmFjdG9yIGZpbmRXaW4sIGl0IGlzIHVnbHlcclxuLy8gVE9ETyBVY29tbWVudCBleHBvbmVudGlhdGlvbiBvcGVyYXRvciBsYXRlclxyXG4vLyBHYW1lIHN0YXRlIGNsYXNzXHJcbmRlZmluZShbJy4vY29uZmlnJywgJy4vcGxheWVyJ10sICh7XHJcbiAgICBnZW5lcmFsOiB7XHJcbiAgICAgIHJvd3MsIGNvbHVtbnMsIGVtcHR5VmFsLCBtYXhUdXJucywgc2lnbnNQZXJSb3VuZCwgd2luTGVuZ3RoLFxyXG4gICAgICBtaW5UdXJuc0ZvclRpZSwgbWF4TGluZUxlbmd0aCwgdHVybnNQZXJSb3VuZCxcclxuICAgIH0sIHBsYXllcnMgfSwgUGxheWVyKSA9PlxyXG4gIGNsYXNzIFN0YXRlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcclxuICAgICAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIHRoaXMuY29uc3RydWN0b3IpIHtcclxuICAgICAgICB0aGlzLnR1cm4gPSBzb3VyY2UudHVybjtcclxuICAgICAgICB0aGlzLmxhc3RNb3ZlID0gc291cmNlLmxhc3RNb3ZlO1xyXG4gICAgICAgIHRoaXMucGxheWVycyA9IHNvdXJjZS5wbGF5ZXJzO1xyXG4gICAgICAgIHRoaXMuZmllbGQgPSB0aGlzLmZpbGxGaWVsZCgocm93LCBjb2wpID0+IHNvdXJjZS5maWVsZFtyb3ddW2NvbF0pO1xyXG4gICAgICAgIHRoaXMub3JkZXJzID0gc291cmNlLm9yZGVycztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnR1cm4gPSAwO1xyXG4gICAgICAgIHRoaXMubGFzdE1vdmUgPSB7fTtcclxuICAgICAgICB0aGlzLnBsYXllcnMgPSBwbGF5ZXJzLm1hcCgoLi4uYXJncykgPT4gbmV3IFBsYXllciguLi5hcmdzKSk7XHJcbiAgICAgICAgdGhpcy5maWVsZCA9IHRoaXMuZmlsbEZpZWxkKCgpID0+IGVtcHR5VmFsKTtcclxuICAgICAgICB0aGlzLm9yZGVycyA9IHtcclxuICAgICAgICAgIG5vcm1hbDogdGhpcy5ub3JtYWxPcmRlci5yZXZlcnNlKCksXHJcbiAgICAgICAgICBzcGlyYWw6IHRoaXMuc3BpcmFsT3JkZXIucmV2ZXJzZSgpLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJbml0aWFsaXplIG1ldGhvZHNcclxuICAgIGZpbGxGaWVsZChmaWxsZXIpIHtcclxuICAgICAgY29uc3QgZmllbGQgPSBbXTtcclxuICAgICAgd2hpbGUgKGZpZWxkLnB1c2goW10pIDwgcm93cykgeyAvKiBEbyBub3RoaW5nICovIH1cclxuICAgICAgZm9yIChsZXQgcm93ID0gcm93czsgcm93LS07KSB7XHJcbiAgICAgICAgZm9yIChsZXQgY29sID0gY29sdW1uczsgY29sLS07KSBmaWVsZFtyb3ddW2NvbF0gPSBmaWxsZXIocm93LCBjb2wpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmaWVsZDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbm9ybWFsT3JkZXIoKSB7XHJcbiAgICAgIHJldHVybiBBcnJheShtYXhUdXJucykuZmlsbCgwKS5tYXAoKGUsIGkpID0+XHJcbiAgICAgICAgICBbfn4oaSAvIGNvbHVtbnMpLCBpICUgY29sdW1uc10pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBzcGlyYWxPcmRlcigpIHtcclxuICAgICAgY29uc3Qgb3JkZXJTcGlyYWxOQ0NXID0gW1sxLCAwXSwgWzAsIC0xXSwgWy0xLCAwXSwgWzAsIDFdXTtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gW107XHJcbiAgICAgIGxldCB2ZWN0b3I7XHJcbiAgICAgIGxldCBbcm93LCBjb2xdID0gW35+KHJvd3MgLyAyKSwgfn4oY29sdW1ucyAvIDIpXTtcclxuICAgICAgbGV0IFt0dXJucywgc3RyYWlnaHQsIGJlZm9yZVR1cm4sIHNlYXJjaGVkXSA9IFswLCAwLCAwLCAwXTtcclxuICAgICAgd2hpbGUgKHNlYXJjaGVkIDwgbWF4VHVybnMpIHtcclxuICAgICAgICBpZiAodGhpcy5jZWxsSW5SYW5nZShyb3csIGNvbCkpIHtcclxuICAgICAgICAgIHJlc3VsdC5wdXNoKFtyb3csIGNvbF0pO1xyXG4gICAgICAgICAgc2VhcmNoZWQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmVjdG9yID0gdHVybnMgJSA0O1xyXG4gICAgICAgIHJvdyArPSBvcmRlclNwaXJhbE5DQ1dbdmVjdG9yXVswXTtcclxuICAgICAgICBjb2wgKz0gb3JkZXJTcGlyYWxOQ0NXW3ZlY3Rvcl1bMV07XHJcbiAgICAgICAgaWYgKGJlZm9yZVR1cm4tLSA9PT0gMCkge1xyXG4gICAgICAgICAgdHVybnMrKztcclxuICAgICAgICAgIGJlZm9yZVR1cm4gPSBzdHJhaWdodDtcclxuICAgICAgICAgIGlmICh2ZWN0b3IgJSAyID09PSAwKSBzdHJhaWdodCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdlbmVyYWwgbWV0aG9kc1xyXG4gICAgZ2V0IGNvcHkoKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU3RhdGUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGN1cnJlbnRQbGF5ZXIoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnBsYXllcnNbfn4odGhpcy50dXJuIC8gc2lnbnNQZXJSb3VuZCkgJVxyXG4gICAgICAgICAgdGhpcy5wbGF5ZXJzLmxlbmd0aF07XHJcbiAgICB9XHJcblxyXG4gICAgY2VsbEluUmFuZ2Uocm93LCBjb2wpIHtcclxuICAgICAgcmV0dXJuIHJvdyA+PSAwICYmIHJvdyA8IHJvd3MgJiYgY29sID49IDAgJiYgY29sIDwgY29sdW1ucztcclxuICAgIH1cclxuXHJcbiAgICBjZWxsSXNFbXB0eShyb3csIGNvbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5maWVsZFtyb3ddW2NvbF0gPT09IGVtcHR5VmFsO1xyXG4gICAgfVxyXG5cclxuICAgIG1ha2VNb3ZlKHJvdywgY29sKSB7XHJcbiAgICAgIGlmICh0aGlzLmNlbGxJc0VtcHR5KHJvdywgY29sKSAmJiB0aGlzLmNlbGxJblJhbmdlKHJvdywgY29sKSkge1xyXG4gICAgICAgIHRoaXMubGFzdE1vdmUgPSB7IHJvdywgY29sLCBwbGF5ZXI6IHRoaXMuY3VycmVudFBsYXllciB9O1xyXG4gICAgICAgIHRoaXMuZmllbGRbcm93XVtjb2xdID0gdGhpcy5sYXN0TW92ZS5wbGF5ZXIuaWQ7XHJcbiAgICAgICAgdGhpcy50dXJuKys7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmlzaXRFbXB0eUNlbGxzKG9yZGVyLCBmbikge1xyXG4gICAgICBsZXQgaSA9IG9yZGVyLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgIGlmICh0aGlzLmNlbGxJc0VtcHR5LmFwcGx5KHRoaXMsIG9yZGVyW2ldKSAmJlxyXG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBvcmRlcltpXSkpIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAhIX5pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpbmQgd2luIG9yIHRpZSBtZXRob2RzXHJcbiAgICBmaW5kV2luKG1ldGhvZCA9ICdtYXAnLCBjb2RlcyA9IFt0aGlzLmxhc3RNb3ZlLnBsYXllci5pZCwgZW1wdHlWYWxdLFxyXG4gICAgICAgIGxpbWl0cyA9IFtJbmZpbml0eSwgMF0sXHJcbiAgICAgICAgcm93ID0gdGhpcy5sYXN0TW92ZS5yb3csIGNvbCA9IHRoaXMubGFzdE1vdmUuY29sKSB7XHJcbiAgICAgIGNvbnN0IHdpbnNEaXJlY3Rpb25zID0gW1swLCAxXSwgWzEsIDBdLCBbLTEsIDFdLCBbMSwgMV1dO1xyXG4gICAgICBsZXQgcmVtYWluO1xyXG5cclxuICAgICAgZnVuY3Rpb24gZ2V0SW5saW5lQ2VsbHMoZGlyUiwgZGlyQywgY291bnRlcikge1xyXG4gICAgICAgIGNvbnN0IHNlcVJvdyA9IHJvdyArIGRpclIgKiBjb3VudGVyO1xyXG4gICAgICAgIGNvbnN0IHNlcUNvbCA9IGNvbCArIGRpckMgKiBjb3VudGVyO1xyXG4gICAgICAgIGlmICh0aGlzLmNlbGxJblJhbmdlKHNlcVJvdywgc2VxQ29sKSkge1xyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5maWVsZFtzZXFSb3ddW3NlcUNvbF0gPT09IGNvZGVzW2ldICYmIHJlbWFpbltpXS0tID4gMCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBnZXRJbmxpbmVDZWxscy5jYWxsKHRoaXMsIGRpclIsIGRpckMsIGNvdW50ZXIgKyAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY291bnRlcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHdpbnNEaXJlY3Rpb25zW21ldGhvZF0oZGlyID0+IHtcclxuICAgICAgICByZW1haW4gPSBsaW1pdHMuc2xpY2UoKTtcclxuICAgICAgICBjb25zdCBsZW4wID0gZ2V0SW5saW5lQ2VsbHMuY2FsbCh0aGlzLCBkaXJbMF0sIGRpclsxXSwgMCk7XHJcbiAgICAgICAgY29uc3QgbGVuMSA9IGdldElubGluZUNlbGxzLmNhbGwodGhpcywgLWRpclswXSwgLWRpclsxXSwgMSkgLSAxO1xyXG4gICAgICAgIHJldHVybiBsZW4wICsgbGVuMSA8IHdpbkxlbmd0aCA/IG51bGwgOiB7XHJcbiAgICAgICAgICBkaXIsIGNvZGVzLCBsaW1pdHMsIHJlbWFpbiwgbGVuZ3RoczogW2xlbjAsIGxlbjFdLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpc1RpZSgpIHtcclxuICAgICAgZnVuY3Rpb24gc29tZWJvZHlDYW5XaW4ocm93LCBjb2wpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wbGF5ZXJzLnNvbWUocCA9PiB0aGlzLmZpbmRXaW4oJ3NvbWUnLCBbcC5pZCwgZW1wdHlWYWxdLFxyXG4gICAgICAgICAgICBbd2luTGVuZ3RoLCBwLm1heFR1cm5zIC0gcC5jb3VudFR1cm5zKHRoaXMudHVybildLCByb3csIGNvbCkpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAhKHRoaXMudHVybiA8IG1pblR1cm5zRm9yVGllIHx8XHJcbiAgICAgICAgICB0aGlzLnZpc2l0RW1wdHlDZWxscyh0aGlzLm9yZGVycy5ub3JtYWwsIHNvbWVib2R5Q2FuV2luKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2ltcGxlIGhldXJpc3RpY3NcclxuICAgIHNjb3JlTW92ZUhldXJpc3RpYyhzY29yZXMgPSB0aGlzLmxhc3RNb3ZlLnBsYXllci5haS5zY29yZSkge1xyXG4gICAgICBjb25zdCB7IHJvdywgY29sLCBwbGF5ZXI6IHsgaWQ6IGxhc3RQbGF5ZXJJRCB9IH0gPSB0aGlzLmxhc3RNb3ZlO1xyXG4gICAgICBsZXQgc2NvcmUgPSAwO1xyXG4gICAgICBsZXQgY29kZXM7XHJcblxyXG4gICAgICAvLyBMb25nIGxpbmUgc2hvdWxkIGJlIHNjb3JlZCBoaWdoZXIgdGhhbiA0IHNob3J0IGxpbmVzXHJcbiAgICAgIGZ1bmN0aW9uIHNjb3JlU2lnbnNBcm91bmQoKSB7XHJcbiAgICAgICAgY29uc3QgbGltaXRzID0gW21heExpbmVMZW5ndGgsIEluZmluaXR5XTtcclxuICAgICAgICBpZiAoY29kZXNbMF0gIT09IGxhc3RQbGF5ZXJJRCkge1xyXG4gICAgICAgICAgY29kZXMucHVzaChsYXN0UGxheWVySUQpO1xyXG4gICAgICAgICAgbGltaXRzLnB1c2goMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRXaW4oJ21hcCcsIGNvZGVzLCBsaW1pdHMsIHJvdywgY29sKS5yZWR1Y2UoKHMsIHdpbikgPT5cclxuICAgICAgICAgIC8vICh3aW4gPyBzICsgNCAqKiAobWF4TGluZUxlbmd0aCAtIHdpbi5yZW1haW5bMF0pIC0gMSA6IHMpLCAwKTtcclxuICAgICAgICAgICh3aW4gPyBzICsgTWF0aC5wb3coNCwgbWF4TGluZUxlbmd0aCAtIHdpbi5yZW1haW5bMF0pIC0gMSA6IHMpLCAwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb2RlcyA9IFsobGFzdFBsYXllcklEICsgaSkgJSB0aGlzLnBsYXllcnMubGVuZ3RoLCBlbXB0eVZhbF07XHJcbiAgICAgICAgaWYgKHRoaXMuZmluZFdpbignc29tZScsIGNvZGVzKSkgcmV0dXJuIHNjb3Jlcy53aW4gKiBzY29yZXMuc2lnbltpXTtcclxuICAgICAgICBzY29yZSArPSBzY29yZVNpZ25zQXJvdW5kLmNhbGwodGhpcykgKiBzY29yZXMuc2lnbltpXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5pc1RpZSkgcmV0dXJuIHNjb3Jlcy50aWU7XHJcbiAgICAgIHJldHVybiBzY29yZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOZWdhTWF4IGltcGxlbWVudGF0aW9uIHdpdGggZmFpbC1zb2Z0IGFscGhhLWJldGEgcHJ1bmluZ1xyXG4gICAgc2NvcmVNb3ZlTWluaW1heChtYXhQbGF5ZXIgPSB0aGlzLmxhc3RNb3ZlLnBsYXllcixcclxuICAgICAgICBhID0gLUluZmluaXR5LCBiID0gSW5maW5pdHksIGRlcHRoID0gbWF4UGxheWVyLmFpLmRlcHRoKSB7XHJcbiAgICAgIGNvbnN0IGlzTWF4ID0gbWF4UGxheWVyID09PSB0aGlzLmN1cnJlbnRQbGF5ZXI7XHJcbiAgICAgIGxldCBhbHBoYSA9IGE7XHJcbiAgICAgIGxldCBiZXRhID0gYjtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHJhdGVNb3ZlKHJvdywgY29sKSB7XHJcbiAgICAgICAgY29uc3Qgc2NvcmUgPSB0aGlzLmNvcHkubWFrZU1vdmUocm93LCBjb2wpXHJcbiAgICAgICAgICAgIC5zY29yZU1vdmVNaW5pbWF4KG1heFBsYXllciwgYWxwaGEsIGJldGEsIGRlcHRoIC0gMSk7XHJcbiAgICAgICAgaWYgKGlzTWF4KSBhbHBoYSA9IE1hdGgubWF4KGFscGhhLCBzY29yZSk7XHJcbiAgICAgICAgZWxzZSBiZXRhID0gTWF0aC5taW4oYmV0YSwgc2NvcmUpO1xyXG4gICAgICAgIHJldHVybiBhbHBoYSA+PSBiZXRhO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGVwdGggPD0gMCB8fCB0aGlzLmZpbmRXaW4oJ3NvbWUnKSB8fCB0aGlzLmlzVGllKSB7XHJcbiAgICAgICAgY29uc3Qgc2lnbiA9IG1heFBsYXllciA9PT0gdGhpcy5sYXN0TW92ZS5wbGF5ZXIgPyAxIDogLTE7XHJcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBkZXB0aCAvIHR1cm5zUGVyUm91bmQgKyAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjb3JlTW92ZUhldXJpc3RpYyhtYXhQbGF5ZXIuYWkuc2NvcmUpICogc2lnbiAqIHNwZWVkO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudmlzaXRFbXB0eUNlbGxzKHRoaXMub3JkZXJzLnNwaXJhbCwgcmF0ZU1vdmUpO1xyXG4gICAgICByZXR1cm4gaXNNYXggPyBhbHBoYSA6IGJldGE7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG5leHRCZXN0TW92ZXMoKSB7XHJcbiAgICAgIGNvbnN0IHNjb3JlVHlwZXMgPSBbJ3Njb3JlTW92ZU1pbmltYXgnLCAnc2NvcmVNb3ZlSGV1cmlzdGljJ107XHJcbiAgICAgIGxldCBtb3ZlcyA9IFtdO1xyXG5cclxuICAgICAgZnVuY3Rpb24gcmF0ZUNlbGwocm93LCBjb2wpIHtcclxuICAgICAgICBjb25zdCBkZWVwID0gdGhpcy5jb3B5Lm1ha2VNb3ZlKHJvdywgY29sKTtcclxuICAgICAgICBtb3Zlcy5wdXNoKHsgcm93LCBjb2wsIHNjb3JlOiBzY29yZVR5cGVzLm1hcCh0eXBlID0+IGRlZXBbdHlwZV0oKSkgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMudmlzaXRFbXB0eUNlbGxzKHRoaXMub3JkZXJzLm5vcm1hbCwgcmF0ZUNlbGwpO1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjb3JlVHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi5tb3Zlcy5tYXAoY2VsbCA9PiBjZWxsLnNjb3JlW2ldKSk7XHJcbiAgICAgICAgbW92ZXMgPSBtb3Zlcy5maWx0ZXIoY2VsbCA9PlxyXG4gICAgICAgICAgICBjZWxsLnNjb3JlW2ldID49IG1heCAtIHRoaXMuY3VycmVudFBsYXllci5haS50b2xlcmFuY2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBtb3ZlcztcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
