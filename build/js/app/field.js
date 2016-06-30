'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Remove this.canvas if not needed
// TODO Maybe apply singleton and decorator patterns
// Field constructor
define(['./config', './line', './utilities'], function (_ref, Line, _ref2) {
  var _ref$general = _ref.general;
  var rows = _ref$general.rows;
  var columns = _ref$general.columns;
  var size = _ref$general.size;
  var left = _ref$general.left;
  var right = _ref$general.right;
  var top = _ref$general.top;
  var bottom = _ref$general.bottom;
  var line = _ref.elements.line;
  var random = _ref2.random;
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
        function randomize(_ref3) {
          var x = _ref3.x;
          var y = _ref3.y;
          var angle = _ref3.angle;

          return {
            x: x + random.error(line.random.move),
            y: y + random.error(line.random.move),
            angle: angle + random.error(line.random.rotate)
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
        var rowAxis = this.lines.hor[row].getBisector(this.lines.hor[row + 1]);
        var colAxis = this.lines.ver[col].getBisector(this.lines.ver[col + 1]);
        return rowAxis.intersects(colAxis);
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
//# sourceMappingURL=data:application/json;base64,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QUNEO0FBQ0QsZUFBTztBQUNMLGVBQUssWUFBWSxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsS0FBZixDQUFxQixDQUFyQixFQUF3QixDQUFDLENBQXpCLENBQVosRUFBeUMsUUFBekMsQ0FEQTtBQUVMLGVBQUssWUFBWSxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsS0FBZixDQUFxQixDQUFyQixFQUF3QixDQUFDLENBQXpCLENBQVosRUFBeUMsVUFBekM7QUFGQSxTQUFQO0FBSUQ7QUF4RXlDOztBQUFBO0FBQUE7QUFBQSxDQUE5QyIsImZpbGUiOiJqcy9hcHAvZmllbGQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIFJlbW92ZSB0aGlzLmNhbnZhcyBpZiBub3QgbmVlZGVkXHJcbi8vIFRPRE8gTWF5YmUgYXBwbHkgc2luZ2xldG9uIGFuZCBkZWNvcmF0b3IgcGF0dGVybnNcclxuLy8gRmllbGQgY29uc3RydWN0b3JcclxuZGVmaW5lKFsnLi9jb25maWcnLCAnLi9saW5lJywgJy4vdXRpbGl0aWVzJ10sICh7XHJcbiAgICAgIGdlbmVyYWw6IHsgcm93cywgY29sdW1ucywgc2l6ZSwgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tIH0sXHJcbiAgICAgIGVsZW1lbnRzOiB7IGxpbmUgfSxcclxuICAgIH0sIExpbmUsIHsgcmFuZG9tIH0pID0+XHJcbiAgY2xhc3MgRmllbGQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICBjb25zdCBjZWxsU2l6ZSA9IE1hdGgubWluKHNpemUgLyBjb2x1bW5zLCBzaXplIC8gcm93cyk7XHJcbiAgICAgIHRoaXMud2lkdGggPSBjZWxsU2l6ZSAqIGNvbHVtbnM7XHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gY2VsbFNpemUgKiByb3dzO1xyXG4gICAgICB0aGlzLmNlbGwgPSB7IHdpZHRoOiBjZWxsU2l6ZSwgaGVpZ2h0OiBjZWxsU2l6ZSB9O1xyXG4gICAgICB0aGlzLmNhbnZhcyA9IHtcclxuICAgICAgICB3aWR0aDogbGVmdCArIHRoaXMud2lkdGggKyByaWdodCxcclxuICAgICAgICBoZWlnaHQ6IHRvcCArIHRoaXMuaGVpZ2h0ICsgYm90dG9tLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5saW5lcyA9ICgoKSA9PiB7XHJcbiAgICAgICAgZnVuY3Rpb24gcmFuZG9taXplKHsgeCwgeSwgYW5nbGUgfSkge1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogeCArIHJhbmRvbS5lcnJvcihsaW5lLnJhbmRvbS5tb3ZlKSxcclxuICAgICAgICAgICAgeTogeSArIHJhbmRvbS5lcnJvcihsaW5lLnJhbmRvbS5tb3ZlKSxcclxuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlICsgcmFuZG9tLmVycm9yKGxpbmUucmFuZG9tLnJvdGF0ZSksXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbGluZXNGYWN0b3J5KGNvdW50LCBnZXRMaW5lQ2ZnKSB7XHJcbiAgICAgICAgICBjb25zdCBzdG9yYWdlID0gW107XHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHN0b3JhZ2UucHVzaChuZXcgTGluZShpICUgY291bnQgPT09IDBcclxuICAgICAgICAgICAgICA/IGdldExpbmVDZmcoaSlcclxuICAgICAgICAgICAgICA6IHJhbmRvbWl6ZShnZXRMaW5lQ2ZnKGkpKSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaG9yOiBsaW5lc0ZhY3Rvcnkocm93cywgaW5kZXggPT4gKHtcclxuICAgICAgICAgICAgeDogbGVmdCArIHRoaXMud2lkdGggLyAyLFxyXG4gICAgICAgICAgICB5OiB0b3AgKyB0aGlzLmNlbGwuaGVpZ2h0ICogaW5kZXgsXHJcbiAgICAgICAgICAgIGFuZ2xlOiAwLFxyXG4gICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgdmVyOiBsaW5lc0ZhY3RvcnkoY29sdW1ucywgaW5kZXggPT4gKHtcclxuICAgICAgICAgICAgeDogbGVmdCArIHRoaXMuY2VsbC53aWR0aCAqIGluZGV4LFxyXG4gICAgICAgICAgICB5OiB0b3AgKyB0aGlzLmhlaWdodCAvIDIsXHJcbiAgICAgICAgICAgIGFuZ2xlOiBNYXRoLlBJIC8gMixcclxuICAgICAgICAgIH0pKSxcclxuICAgICAgICB9O1xyXG4gICAgICB9KSgpO1xyXG5cclxuICAgICAgdGhpcy5saW5lcy52aXNpYmxlID1cclxuICAgICAgICAgIHRoaXMubGluZXMudmVyLnNsaWNlKDEsIC0xKS5jb25jYXQodGhpcy5saW5lcy5ob3Iuc2xpY2UoMSwgLTEpKTtcclxuICAgICAgT2JqZWN0LmZyZWV6ZSh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDZWxsQ2VudGVyKHJvdywgY29sKSB7XHJcbiAgICAgIGNvbnN0IHJvd0F4aXMgPSB0aGlzLmxpbmVzLmhvcltyb3ddLmdldEJpc2VjdG9yKHRoaXMubGluZXMuaG9yW3JvdyArIDFdKTtcclxuICAgICAgY29uc3QgY29sQXhpcyA9IHRoaXMubGluZXMudmVyW2NvbF0uZ2V0QmlzZWN0b3IodGhpcy5saW5lcy52ZXJbY29sICsgMV0pO1xyXG4gICAgICByZXR1cm4gcm93QXhpcy5pbnRlcnNlY3RzKGNvbEF4aXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENlbGxQb3NpdGlvbih4LCB5KSB7XHJcbiAgICAgIGNvbnN0IGhvcml6b250YWwgPSBuZXcgTGluZSh7IHgsIHksIGFuZ2xlOiAwIH0pO1xyXG4gICAgICBjb25zdCB2ZXJ0aWNhbCA9IG5ldyBMaW5lKHsgeCwgeSwgYW5nbGU6IE1hdGguUEkgLyAyIH0pO1xyXG4gICAgICBmdW5jdGlvbiBnZXRQb3NpdGlvbihsaW5lcywgcnVsZXIpIHtcclxuICAgICAgICBjb25zdCBkb3RCZWZvcmVMaW5lID0gbGluZXMuZmluZEluZGV4KGxuID0+XHJcbiAgICAgICAgICAocG9pbnQgPT4gcG9pbnQueCA+IHggfHwgcG9pbnQueSA+IHkpKGxuLmludGVyc2VjdHMocnVsZXIpKSk7XHJcbiAgICAgICAgcmV0dXJuIH5kb3RCZWZvcmVMaW5lID8gZG90QmVmb3JlTGluZSA6IGxpbmVzLmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJvdzogZ2V0UG9zaXRpb24odGhpcy5saW5lcy5ob3Iuc2xpY2UoMSwgLTEpLCB2ZXJ0aWNhbCksXHJcbiAgICAgICAgY29sOiBnZXRQb3NpdGlvbih0aGlzLmxpbmVzLnZlci5zbGljZSgxLCAtMSksIGhvcml6b250YWwpLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICB9XHJcbik7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
