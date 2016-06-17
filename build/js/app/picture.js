'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Lines length can be corrected via reducing frames.total
// TODO Refactor sprite config objects
// TODO All possible sprites should be predefined
// Visualization constructor
define(['./config', './utilities', './sprite'], function (_ref, _ref2, Sprite) {
  var cfg = _ref.general;
  var _ref$elements = _ref.elements;
  var line = _ref$elements.line;
  var sign = _ref$elements.sign;
  var random = _ref2.random;
  return function () {
    function Picture(field, canvas) {
      _classCallCheck(this, Picture);

      this.field = field;
      this.canvas = canvas;
      this.context = this.canvas.getContext('2d');
      this.sprites = [];
    }

    _createClass(Picture, [{
      key: 'drawSprite',
      value: function drawSprite(sprite) {
        function clearCanvas() {
          this.context.setTransform(1, 0, 0, 1, 0, 0);
          this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        function draw(sp) {
          this.context.setTransform(1, 0, 0, 1, 0, 0);
          this.context.translate(sp.center.x, sp.center.y);
          this.context.rotate(sp.angle);
          this.context.scale(sp.scale.width, sp.scale.height);
          this.context.drawImage(sp.image, sp.frames.width * (sp.frames.current % sp.frames.inRow), sp.frames.height * ~ ~(sp.frames.current / sp.frames.inRow), sp.frames.width, sp.frames.height, sp.dx, sp.dy, sp.width, sp.height);
        }

        if (!(sprite instanceof Sprite)) {
          throw new TypeError('Argument is not a sprite: ' + sprite);
        }
        if (! ~sprite.frames.current) this.sprites.push(sprite);
        if (sprite.frames.next()) {
          setTimeout(this.drawSprite.bind(this, sprite), sprite.frames.delay);
        }
        clearCanvas.call(this);
        this.sprites.forEach(draw, this);
      }
    }, {
      key: 'drawField',
      value: function drawField() {
        var lineID = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        var ln = this.field.lines.visible[lineID];
        if (ln) {
          setTimeout(this.drawField.bind(this, lineID + 1), line.pause);
          this.drawSprite(new Sprite({
            imgID: line.random.imgID,
            color: line.color,
            frames: line.frames,
            container: this.field,
            center: { x: ln.x, y: ln.y },
            angle: ln.angle,
            scale: {
              width: random.sign + line.random.scale,
              height: random.sign * cfg.defaultRowsCols / Math.max(cfg.rows, cfg.columns) + line.random.scale
            }
          }));
        }
      }
    }, {
      key: 'drawSign',
      value: function drawSign(row, col, player) {
        var cellCenter = this.field.getCellCenter(row, col);
        cellCenter.x += sign.random.move;
        cellCenter.y += sign.random.move;
        this.drawSprite(new Sprite({
          imgID: sign.random.imgID[player.signID],
          color: player.color || sign.color,
          frames: sign.frames,
          container: this.field.cell,
          center: cellCenter,
          angle: sign.random.rotate,
          scale: {
            width: random.sign + sign.random.scale,
            height: random.sign + sign.random.scale
          }
        }));
      }
    }]);

    return Picture;
  }();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC9waWN0dXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFJQSxPQUFPLENBQUMsVUFBRCxFQUFhLGFBQWIsRUFBNEIsVUFBNUIsQ0FBUCxFQUFnRCx1QkFDWSxNQURaO0FBQUEsTUFDakMsR0FEaUMsUUFDMUMsT0FEMEM7QUFBQSwyQkFDNUIsUUFENEI7QUFBQSxNQUNoQixJQURnQixpQkFDaEIsSUFEZ0I7QUFBQSxNQUNWLElBRFUsaUJBQ1YsSUFEVTtBQUFBLE1BQ0UsTUFERixTQUNFLE1BREY7QUFBQTtBQUk1QyxxQkFBWSxLQUFaLEVBQW1CLE1BQW5CLEVBQTJCO0FBQUE7O0FBQ3pCLFdBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxXQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsV0FBSyxPQUFMLEdBQWUsS0FBSyxNQUFMLENBQVksVUFBWixDQUF1QixJQUF2QixDQUFmO0FBQ0EsV0FBSyxPQUFMLEdBQWUsRUFBZjtBQUNEOztBQVQyQztBQUFBO0FBQUEsaUNBV2pDLE1BWGlDLEVBV3pCO0FBQ2pCLGlCQUFTLFdBQVQsR0FBdUI7QUFDckIsZUFBSyxPQUFMLENBQWEsWUFBYixDQUEwQixDQUExQixFQUE2QixDQUE3QixFQUFnQyxDQUFoQyxFQUFtQyxDQUFuQyxFQUFzQyxDQUF0QyxFQUF5QyxDQUF6QztBQUNBLGVBQUssT0FBTCxDQUFhLFNBQWIsQ0FBdUIsQ0FBdkIsRUFBMEIsQ0FBMUIsRUFBNkIsS0FBSyxNQUFMLENBQVksS0FBekMsRUFBZ0QsS0FBSyxNQUFMLENBQVksTUFBNUQ7QUFDRDs7QUFFRCxpQkFBUyxJQUFULENBQWMsRUFBZCxFQUFrQjtBQUNoQixlQUFLLE9BQUwsQ0FBYSxZQUFiLENBQTBCLENBQTFCLEVBQTZCLENBQTdCLEVBQWdDLENBQWhDLEVBQW1DLENBQW5DLEVBQXNDLENBQXRDLEVBQXlDLENBQXpDO0FBQ0EsZUFBSyxPQUFMLENBQWEsU0FBYixDQUF1QixHQUFHLE1BQUgsQ0FBVSxDQUFqQyxFQUFvQyxHQUFHLE1BQUgsQ0FBVSxDQUE5QztBQUNBLGVBQUssT0FBTCxDQUFhLE1BQWIsQ0FBb0IsR0FBRyxLQUF2QjtBQUNBLGVBQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsR0FBRyxLQUFILENBQVMsS0FBNUIsRUFBbUMsR0FBRyxLQUFILENBQVMsTUFBNUM7QUFDQSxlQUFLLE9BQUwsQ0FBYSxTQUFiLENBQ0ksR0FBRyxLQURQLEVBRUksR0FBRyxNQUFILENBQVUsS0FBVixJQUFtQixHQUFHLE1BQUgsQ0FBVSxPQUFWLEdBQW9CLEdBQUcsTUFBSCxDQUFVLEtBQWpELENBRkosRUFHSSxHQUFHLE1BQUgsQ0FBVSxNQUFWLEdBQW1CLEVBQUMsRUFBRSxHQUFHLE1BQUgsQ0FBVSxPQUFWLEdBQW9CLEdBQUcsTUFBSCxDQUFVLEtBQWhDLENBSHhCLEVBSUksR0FBRyxNQUFILENBQVUsS0FKZCxFQUtJLEdBQUcsTUFBSCxDQUFVLE1BTGQsRUFNSSxHQUFHLEVBTlAsRUFPSSxHQUFHLEVBUFAsRUFRSSxHQUFHLEtBUlAsRUFTSSxHQUFHLE1BVFA7QUFVRDs7QUFFRCxZQUFJLEVBQUUsa0JBQWtCLE1BQXBCLENBQUosRUFBaUM7QUFDL0IsZ0JBQU0sSUFBSSxTQUFKLGdDQUEyQyxNQUEzQyxDQUFOO0FBQ0Q7QUFDRCxZQUFJLEVBQUMsQ0FBQyxPQUFPLE1BQVAsQ0FBYyxPQUFwQixFQUE2QixLQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLE1BQWxCO0FBQzdCLFlBQUksT0FBTyxNQUFQLENBQWMsSUFBZCxFQUFKLEVBQTBCO0FBQ3hCLHFCQUFXLEtBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixJQUFyQixFQUEyQixNQUEzQixDQUFYLEVBQStDLE9BQU8sTUFBUCxDQUFjLEtBQTdEO0FBQ0Q7QUFDRCxvQkFBWSxJQUFaLENBQWlCLElBQWpCO0FBQ0EsYUFBSyxPQUFMLENBQWEsT0FBYixDQUFxQixJQUFyQixFQUEyQixJQUEzQjtBQUNEO0FBM0MyQztBQUFBO0FBQUEsa0NBNkN0QjtBQUFBLFlBQVosTUFBWSx5REFBSCxDQUFHOztBQUNwQixZQUFNLEtBQUssS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixPQUFqQixDQUF5QixNQUF6QixDQUFYO0FBQ0EsWUFBSSxFQUFKLEVBQVE7QUFDTixxQkFBVyxLQUFLLFNBQUwsQ0FBZSxJQUFmLENBQW9CLElBQXBCLEVBQTBCLFNBQVMsQ0FBbkMsQ0FBWCxFQUFrRCxLQUFLLEtBQXZEO0FBQ0EsZUFBSyxVQUFMLENBQWdCLElBQUksTUFBSixDQUFXO0FBQ3pCLG1CQUFPLEtBQUssTUFBTCxDQUFZLEtBRE07QUFFekIsbUJBQU8sS0FBSyxLQUZhO0FBR3pCLG9CQUFRLEtBQUssTUFIWTtBQUl6Qix1QkFBVyxLQUFLLEtBSlM7QUFLekIsb0JBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBUixFQUFXLEdBQUcsR0FBRyxDQUFqQixFQUxpQjtBQU16QixtQkFBTyxHQUFHLEtBTmU7QUFPekIsbUJBQU87QUFDTCxxQkFBTyxPQUFPLElBQVAsR0FBYyxLQUFLLE1BQUwsQ0FBWSxLQUQ1QjtBQUVMLHNCQUFRLE9BQU8sSUFBUCxHQUFjLElBQUksZUFBbEIsR0FDSixLQUFLLEdBQUwsQ0FBUyxJQUFJLElBQWIsRUFBbUIsSUFBSSxPQUF2QixDQURJLEdBQzhCLEtBQUssTUFBTCxDQUFZO0FBSDdDO0FBUGtCLFdBQVgsQ0FBaEI7QUFhRDtBQUNGO0FBL0QyQztBQUFBO0FBQUEsK0JBaUVuQyxHQWpFbUMsRUFpRTlCLEdBakU4QixFQWlFekIsTUFqRXlCLEVBaUVqQjtBQUN6QixZQUFNLGFBQWEsS0FBSyxLQUFMLENBQVcsYUFBWCxDQUF5QixHQUF6QixFQUE4QixHQUE5QixDQUFuQjtBQUNBLG1CQUFXLENBQVgsSUFBZ0IsS0FBSyxNQUFMLENBQVksSUFBNUI7QUFDQSxtQkFBVyxDQUFYLElBQWdCLEtBQUssTUFBTCxDQUFZLElBQTVCO0FBQ0EsYUFBSyxVQUFMLENBQWdCLElBQUksTUFBSixDQUFXO0FBQ3pCLGlCQUFPLEtBQUssTUFBTCxDQUFZLEtBQVosQ0FBa0IsT0FBTyxNQUF6QixDQURrQjtBQUV6QixpQkFBTyxPQUFPLEtBQVAsSUFBZ0IsS0FBSyxLQUZIO0FBR3pCLGtCQUFRLEtBQUssTUFIWTtBQUl6QixxQkFBVyxLQUFLLEtBQUwsQ0FBVyxJQUpHO0FBS3pCLGtCQUFRLFVBTGlCO0FBTXpCLGlCQUFPLEtBQUssTUFBTCxDQUFZLE1BTk07QUFPekIsaUJBQU87QUFDTCxtQkFBTyxPQUFPLElBQVAsR0FBYyxLQUFLLE1BQUwsQ0FBWSxLQUQ1QjtBQUVMLG9CQUFRLE9BQU8sSUFBUCxHQUFjLEtBQUssTUFBTCxDQUFZO0FBRjdCO0FBUGtCLFNBQVgsQ0FBaEI7QUFZRDtBQWpGMkM7O0FBQUE7QUFBQTtBQUFBLENBQWhEIiwiZmlsZSI6ImpzL2FwcC9waWN0dXJlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETyBMaW5lcyBsZW5ndGggY2FuIGJlIGNvcnJlY3RlZCB2aWEgcmVkdWNpbmcgZnJhbWVzLnRvdGFsXHJcbi8vIFRPRE8gUmVmYWN0b3Igc3ByaXRlIGNvbmZpZyBvYmplY3RzXHJcbi8vIFRPRE8gQWxsIHBvc3NpYmxlIHNwcml0ZXMgc2hvdWxkIGJlIHByZWRlZmluZWRcclxuLy8gVmlzdWFsaXphdGlvbiBjb25zdHJ1Y3RvclxyXG5kZWZpbmUoWycuL2NvbmZpZycsICcuL3V0aWxpdGllcycsICcuL3Nwcml0ZSddLCAoXHJcbiAgICB7IGdlbmVyYWw6IGNmZywgZWxlbWVudHM6IHsgbGluZSwgc2lnbiB9IH0sIHsgcmFuZG9tIH0sIFNwcml0ZSkgPT5cclxuICBjbGFzcyBQaWN0dXJlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihmaWVsZCwgY2FudmFzKSB7XHJcbiAgICAgIHRoaXMuZmllbGQgPSBmaWVsZDtcclxuICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgIHRoaXMuc3ByaXRlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdTcHJpdGUoc3ByaXRlKSB7XHJcbiAgICAgIGZ1bmN0aW9uIGNsZWFyQ2FudmFzKCkge1xyXG4gICAgICAgIHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gZHJhdyhzcCkge1xyXG4gICAgICAgIHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0LnRyYW5zbGF0ZShzcC5jZW50ZXIueCwgc3AuY2VudGVyLnkpO1xyXG4gICAgICAgIHRoaXMuY29udGV4dC5yb3RhdGUoc3AuYW5nbGUpO1xyXG4gICAgICAgIHRoaXMuY29udGV4dC5zY2FsZShzcC5zY2FsZS53aWR0aCwgc3Auc2NhbGUuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKFxyXG4gICAgICAgICAgICBzcC5pbWFnZSxcclxuICAgICAgICAgICAgc3AuZnJhbWVzLndpZHRoICogKHNwLmZyYW1lcy5jdXJyZW50ICUgc3AuZnJhbWVzLmluUm93KSxcclxuICAgICAgICAgICAgc3AuZnJhbWVzLmhlaWdodCAqIH5+KHNwLmZyYW1lcy5jdXJyZW50IC8gc3AuZnJhbWVzLmluUm93KSxcclxuICAgICAgICAgICAgc3AuZnJhbWVzLndpZHRoLFxyXG4gICAgICAgICAgICBzcC5mcmFtZXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBzcC5keCxcclxuICAgICAgICAgICAgc3AuZHksXHJcbiAgICAgICAgICAgIHNwLndpZHRoLFxyXG4gICAgICAgICAgICBzcC5oZWlnaHQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIShzcHJpdGUgaW5zdGFuY2VvZiBTcHJpdGUpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQXJndW1lbnQgaXMgbm90IGEgc3ByaXRlOiAke3Nwcml0ZX1gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIX5zcHJpdGUuZnJhbWVzLmN1cnJlbnQpIHRoaXMuc3ByaXRlcy5wdXNoKHNwcml0ZSk7XHJcbiAgICAgIGlmIChzcHJpdGUuZnJhbWVzLm5leHQoKSkge1xyXG4gICAgICAgIHNldFRpbWVvdXQodGhpcy5kcmF3U3ByaXRlLmJpbmQodGhpcywgc3ByaXRlKSwgc3ByaXRlLmZyYW1lcy5kZWxheSk7XHJcbiAgICAgIH1cclxuICAgICAgY2xlYXJDYW52YXMuY2FsbCh0aGlzKTtcclxuICAgICAgdGhpcy5zcHJpdGVzLmZvckVhY2goZHJhdywgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0ZpZWxkKGxpbmVJRCA9IDApIHtcclxuICAgICAgY29uc3QgbG4gPSB0aGlzLmZpZWxkLmxpbmVzLnZpc2libGVbbGluZUlEXTtcclxuICAgICAgaWYgKGxuKSB7XHJcbiAgICAgICAgc2V0VGltZW91dCh0aGlzLmRyYXdGaWVsZC5iaW5kKHRoaXMsIGxpbmVJRCArIDEpLCBsaW5lLnBhdXNlKTtcclxuICAgICAgICB0aGlzLmRyYXdTcHJpdGUobmV3IFNwcml0ZSh7XHJcbiAgICAgICAgICBpbWdJRDogbGluZS5yYW5kb20uaW1nSUQsXHJcbiAgICAgICAgICBjb2xvcjogbGluZS5jb2xvcixcclxuICAgICAgICAgIGZyYW1lczogbGluZS5mcmFtZXMsXHJcbiAgICAgICAgICBjb250YWluZXI6IHRoaXMuZmllbGQsXHJcbiAgICAgICAgICBjZW50ZXI6IHsgeDogbG4ueCwgeTogbG4ueSB9LFxyXG4gICAgICAgICAgYW5nbGU6IGxuLmFuZ2xlLFxyXG4gICAgICAgICAgc2NhbGU6IHtcclxuICAgICAgICAgICAgd2lkdGg6IHJhbmRvbS5zaWduICsgbGluZS5yYW5kb20uc2NhbGUsXHJcbiAgICAgICAgICAgIGhlaWdodDogcmFuZG9tLnNpZ24gKiBjZmcuZGVmYXVsdFJvd3NDb2xzIC9cclxuICAgICAgICAgICAgICAgIE1hdGgubWF4KGNmZy5yb3dzLCBjZmcuY29sdW1ucykgKyBsaW5lLnJhbmRvbS5zY2FsZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd1NpZ24ocm93LCBjb2wsIHBsYXllcikge1xyXG4gICAgICBjb25zdCBjZWxsQ2VudGVyID0gdGhpcy5maWVsZC5nZXRDZWxsQ2VudGVyKHJvdywgY29sKTtcclxuICAgICAgY2VsbENlbnRlci54ICs9IHNpZ24ucmFuZG9tLm1vdmU7XHJcbiAgICAgIGNlbGxDZW50ZXIueSArPSBzaWduLnJhbmRvbS5tb3ZlO1xyXG4gICAgICB0aGlzLmRyYXdTcHJpdGUobmV3IFNwcml0ZSh7XHJcbiAgICAgICAgaW1nSUQ6IHNpZ24ucmFuZG9tLmltZ0lEW3BsYXllci5zaWduSURdLFxyXG4gICAgICAgIGNvbG9yOiBwbGF5ZXIuY29sb3IgfHwgc2lnbi5jb2xvcixcclxuICAgICAgICBmcmFtZXM6IHNpZ24uZnJhbWVzLFxyXG4gICAgICAgIGNvbnRhaW5lcjogdGhpcy5maWVsZC5jZWxsLFxyXG4gICAgICAgIGNlbnRlcjogY2VsbENlbnRlcixcclxuICAgICAgICBhbmdsZTogc2lnbi5yYW5kb20ucm90YXRlLFxyXG4gICAgICAgIHNjYWxlOiB7XHJcbiAgICAgICAgICB3aWR0aDogcmFuZG9tLnNpZ24gKyBzaWduLnJhbmRvbS5zY2FsZSxcclxuICAgICAgICAgIGhlaWdodDogcmFuZG9tLnNpZ24gKyBzaWduLnJhbmRvbS5zY2FsZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
