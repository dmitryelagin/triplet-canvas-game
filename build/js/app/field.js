'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Remove this.canvas if not needed
// Field constructor
define(['./config', './line'], function (_ref, Line) {
  var _ref$general = _ref.general;
  var rows = _ref$general.rows;
  var columns = _ref$general.columns;
  var size = _ref$general.size;
  var left = _ref$general.left;
  var right = _ref$general.right;
  var top = _ref$general.top;
  var bottom = _ref$general.bottom;
  var line = _ref.elements.line;
  return function () {
    function Field() {
      var _this = this;

      _classCallCheck(this, Field);

      var cellSize = Math.min(size / columns, size / rows);
      this.width = cellSize * columns;
      this.height = cellSize * rows;
      this.cell = { width: cellSize, height: cellSize };
      this.canvas = {
        width: left + this.width + right,
        height: top + this.height + bottom
      };

      this.lines = function () {
        function randomize(_ref2) {
          var x = _ref2.x;
          var y = _ref2.y;
          var angle = _ref2.angle;

          return {
            x: x + line.random.move,
            y: y + line.random.move,
            angle: angle + line.random.rotate
          };
        }

        function linesFactory(count, getLineCfg) {
          var storage = [];
          for (var i = 0; i <= count; i++) {
            storage.push(new Line(i % count === 0 ? getLineCfg(i) : randomize(getLineCfg(i))));
          }
          return storage;
        }

        return {
          hor: linesFactory(rows, function (index) {
            return {
              x: left + _this.width / 2,
              y: top + _this.cell.height * index,
              angle: 0
            };
          }),
          ver: linesFactory(columns, function (index) {
            return {
              x: left + _this.cell.width * index,
              y: top + _this.height / 2,
              angle: Math.PI / 2
            };
          })
        };
      }();

      this.lines.visible = this.lines.ver.slice(1, -1).concat(this.lines.hor.slice(1, -1));
      Object.freeze(this);
    }

    _createClass(Field, [{
      key: 'getCellCenter',
      value: function getCellCenter(row, col) {
        var rowCenter = this.lines.hor[row].getBisector(this.lines.hor[row + 1]);
        var colCenter = this.lines.ver[col].getBisector(this.lines.ver[col + 1]);
        return rowCenter.intersects(colCenter);
      }
    }, {
      key: 'getCellPosition',
      value: function getCellPosition(x, y) {
        var horizontal = new Line({ x: x, y: y, angle: 0 });
        var vertical = new Line({ x: x, y: y, angle: Math.PI / 2 });
        function getPosition(lines, ruler) {
          var dotBeforeLine = lines.findIndex(function (ln) {
            return function (point) {
              return point.x > x || point.y > y;
            }(ln.intersects(ruler));
          });
          return ~dotBeforeLine ? dotBeforeLine : lines.length;
        }
        return {
          row: getPosition(this.lines.hor.slice(1, -1), vertical),
          col: getPosition(this.lines.ver.slice(1, -1), horizontal)
        };
      }
    }]);

    return Field;
  }();
});
//# sourceMappingURL=data:application/json;base64,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QUssWUFBWSxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsS0FBZixDQUFxQixDQUFyQixFQUF3QixDQUFDLENBQXpCLENBQVosRUFBeUMsVUFBekM7QUFGQSxTQUFQO0FBSUQ7QUF2RTBCOztBQUFBO0FBQUE7QUFBQSxDQUEvQiIsImZpbGUiOiJqcy9hcHAvZmllbGQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIFJlbW92ZSB0aGlzLmNhbnZhcyBpZiBub3QgbmVlZGVkXHJcbi8vIEZpZWxkIGNvbnN0cnVjdG9yXHJcbmRlZmluZShbJy4vY29uZmlnJywgJy4vbGluZSddLCAoe1xyXG4gICAgICBnZW5lcmFsOiB7IHJvd3MsIGNvbHVtbnMsIHNpemUsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB9LFxyXG4gICAgICBlbGVtZW50czogeyBsaW5lIH0sXHJcbiAgICB9LCBMaW5lKSA9PlxyXG4gIGNsYXNzIEZpZWxkIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgY29uc3QgY2VsbFNpemUgPSBNYXRoLm1pbihzaXplIC8gY29sdW1ucywgc2l6ZSAvIHJvd3MpO1xyXG4gICAgICB0aGlzLndpZHRoID0gY2VsbFNpemUgKiBjb2x1bW5zO1xyXG4gICAgICB0aGlzLmhlaWdodCA9IGNlbGxTaXplICogcm93cztcclxuICAgICAgdGhpcy5jZWxsID0geyB3aWR0aDogY2VsbFNpemUsIGhlaWdodDogY2VsbFNpemUgfTtcclxuICAgICAgdGhpcy5jYW52YXMgPSB7XHJcbiAgICAgICAgd2lkdGg6IGxlZnQgKyB0aGlzLndpZHRoICsgcmlnaHQsXHJcbiAgICAgICAgaGVpZ2h0OiB0b3AgKyB0aGlzLmhlaWdodCArIGJvdHRvbSxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMubGluZXMgPSAoKCkgPT4ge1xyXG4gICAgICAgIGZ1bmN0aW9uIHJhbmRvbWl6ZSh7IHgsIHksIGFuZ2xlIH0pIHtcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IHggKyBsaW5lLnJhbmRvbS5tb3ZlLFxyXG4gICAgICAgICAgICB5OiB5ICsgbGluZS5yYW5kb20ubW92ZSxcclxuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlICsgbGluZS5yYW5kb20ucm90YXRlLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxpbmVzRmFjdG9yeShjb3VudCwgZ2V0TGluZUNmZykge1xyXG4gICAgICAgICAgY29uc3Qgc3RvcmFnZSA9IFtdO1xyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBzdG9yYWdlLnB1c2gobmV3IExpbmUoXHJcbiAgICAgICAgICAgICAgICBpICUgY291bnQgPT09IDAgPyBnZXRMaW5lQ2ZnKGkpIDogcmFuZG9taXplKGdldExpbmVDZmcoaSkpKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBob3I6IGxpbmVzRmFjdG9yeShyb3dzLCBpbmRleCA9PiAoe1xyXG4gICAgICAgICAgICB4OiBsZWZ0ICsgdGhpcy53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgIHk6IHRvcCArIHRoaXMuY2VsbC5oZWlnaHQgKiBpbmRleCxcclxuICAgICAgICAgICAgYW5nbGU6IDAsXHJcbiAgICAgICAgICB9KSksXHJcbiAgICAgICAgICB2ZXI6IGxpbmVzRmFjdG9yeShjb2x1bW5zLCBpbmRleCA9PiAoe1xyXG4gICAgICAgICAgICB4OiBsZWZ0ICsgdGhpcy5jZWxsLndpZHRoICogaW5kZXgsXHJcbiAgICAgICAgICAgIHk6IHRvcCArIHRoaXMuaGVpZ2h0IC8gMixcclxuICAgICAgICAgICAgYW5nbGU6IE1hdGguUEkgLyAyLFxyXG4gICAgICAgICAgfSkpLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pKCk7XHJcblxyXG4gICAgICB0aGlzLmxpbmVzLnZpc2libGUgPVxyXG4gICAgICAgICAgdGhpcy5saW5lcy52ZXIuc2xpY2UoMSwgLTEpLmNvbmNhdCh0aGlzLmxpbmVzLmhvci5zbGljZSgxLCAtMSkpO1xyXG4gICAgICBPYmplY3QuZnJlZXplKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENlbGxDZW50ZXIocm93LCBjb2wpIHtcclxuICAgICAgY29uc3Qgcm93Q2VudGVyID0gdGhpcy5saW5lcy5ob3Jbcm93XS5nZXRCaXNlY3Rvcih0aGlzLmxpbmVzLmhvcltyb3cgKyAxXSk7XHJcbiAgICAgIGNvbnN0IGNvbENlbnRlciA9IHRoaXMubGluZXMudmVyW2NvbF0uZ2V0QmlzZWN0b3IodGhpcy5saW5lcy52ZXJbY29sICsgMV0pO1xyXG4gICAgICByZXR1cm4gcm93Q2VudGVyLmludGVyc2VjdHMoY29sQ2VudGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDZWxsUG9zaXRpb24oeCwgeSkge1xyXG4gICAgICBjb25zdCBob3Jpem9udGFsID0gbmV3IExpbmUoeyB4LCB5LCBhbmdsZTogMCB9KTtcclxuICAgICAgY29uc3QgdmVydGljYWwgPSBuZXcgTGluZSh7IHgsIHksIGFuZ2xlOiBNYXRoLlBJIC8gMiB9KTtcclxuICAgICAgZnVuY3Rpb24gZ2V0UG9zaXRpb24obGluZXMsIHJ1bGVyKSB7XHJcbiAgICAgICAgY29uc3QgZG90QmVmb3JlTGluZSA9IGxpbmVzLmZpbmRJbmRleChsbiA9PlxyXG4gICAgICAgICAgKHBvaW50ID0+IHBvaW50LnggPiB4IHx8IHBvaW50LnkgPiB5KShsbi5pbnRlcnNlY3RzKHJ1bGVyKSkpO1xyXG4gICAgICAgIHJldHVybiB+ZG90QmVmb3JlTGluZSA/IGRvdEJlZm9yZUxpbmUgOiBsaW5lcy5sZW5ndGg7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByb3c6IGdldFBvc2l0aW9uKHRoaXMubGluZXMuaG9yLnNsaWNlKDEsIC0xKSwgdmVydGljYWwpLFxyXG4gICAgICAgIGNvbDogZ2V0UG9zaXRpb24odGhpcy5saW5lcy52ZXIuc2xpY2UoMSwgLTEpLCBob3Jpem9udGFsKSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
