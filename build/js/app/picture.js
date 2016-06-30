'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Lines length can be corrected via reducing frames.total
// TODO Maybe use singleton and check if instance is initialized
// TODO Functions in initialize method are ugly, maybe refactor them
define(['./config', './utilities', './sprite'], function (_ref, _ref2, Sprite) {
  var cfg = _ref.general;
  var players = _ref.players;
  var _ref$elements = _ref.elements;
  var line = _ref$elements.line;
  var sign = _ref$elements.sign;
  var random = _ref2.random;
  return(
    // Visualization class
    function () {
      function Picture(field, canvas) {
        _classCallCheck(this, Picture);

        this.field = field;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.sprites = new Set();
        this.builders = {};
      }

      _createClass(Picture, [{
        key: 'initialize',
        value: function initialize(images) {
          var _this = this;

          function makeBuilder(imgIndexes) {
            var imgs = imgIndexes.map(function (id) {
              return images[id];
            });
            imgs[Symbol.iterator] = function iterate() {
              var self = this;
              return {
                next: function next() {
                  return { done: false, value: random.item(self) };
                }
              };
            };
            return new Sprite.StandardSpriteBuilder(imgs);
          }

          function colorize(color, value, index) {
            return color[index % 4] || value;
          }

          this.builders.line = line.imgID.map(function (arr) {
            return makeBuilder(arr).modify(colorize.bind(null, line.color)).slice(line.frames.total, line.frames.inline).fit(_this.field.width, _this.field.height).delay(1000 / line.frames.fps).translate().rotate().scale(1, cfg.defaultRowsCols / Math.max(cfg.rows, cfg.columns), function (val) {
              return random.sign * val + random.error(line.random.scale);
            });
          });

          this.builders.sign = sign.imgID.map(function (arr, id) {
            return makeBuilder(arr).modify(colorize.bind(null, players[id].color || sign.color)).slice(sign.frames.total, sign.frames.inline).fit(_this.field.cell.width, _this.field.cell.height).delay(1000 / sign.frames.fps).translate(undefined, function (val) {
              return val + random.error(sign.random.move);
            }).rotate(0, function (val) {
              return val + random.error(sign.random.rotate);
            }).scale(1, 1, function (val) {
              return random.sign * val + random.error(sign.random.scale);
            });
          });
        }
      }, {
        key: 'drawSprite',
        value: function drawSprite(sprite) {
          var _this2 = this;

          var clearCanvas = function clearCanvas() {
            _this2.ctx.setTransform(1, 0, 0, 1, 0, 0);
            _this2.ctx.clearRect(0, 0, _this2.canvas.width, _this2.canvas.height);
          };

          var draw = function draw(sp) {
            var _ctx2;

            _this2.ctx.setTransform(1, 0, 0, 1, 0, 0);
            sp.transformations.forEach(function (values, transformation) {
              var _ctx;

              return (_ctx = _this2.ctx)[transformation].apply(_ctx, _toConsumableArray(values));
            });
            (_ctx2 = _this2.ctx).drawImage.apply(_ctx2, _toConsumableArray(sp.drawArguments));
          };

          if (sprite instanceof Sprite.Sprite) this.sprites.add(sprite);else throw new TypeError('Argument is not a sprite: ' + sprite);
          var done = sprite.nextFrame();
          if (!done) {
            setTimeout(this.drawSprite.bind(this, sprite), sprite.timing);
            clearCanvas();
            this.sprites.forEach(draw);
          }
        }
      }, {
        key: 'drawField',
        value: function drawField() {
          var lineID = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

          if (this.field.lines.visible[lineID]) {
            var _field$lines$visible$ = this.field.lines.visible[lineID];
            var x = _field$lines$visible$.x;
            var y = _field$lines$visible$.y;
            var angle = _field$lines$visible$.angle;

            setTimeout(this.drawField.bind(this, lineID + 1), line.pause);
            this.drawSprite(this.builders.line[0].translate(x, y).rotate(angle).build());
          }
        }
      }, {
        key: 'drawSign',
        value: function drawSign(row, col, playerID) {
          var _field$getCellCenter = this.field.getCellCenter(row, col);

          var x = _field$getCellCenter.x;
          var y = _field$getCellCenter.y;

          this.drawSprite(this.builders.sign[playerID].translate(x, y).build());
        }
      }]);

      return Picture;
    }()
  );
});
//# sourceMappingURL=data:application/json;base64,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QXRDLENBQTZDLEtBQTdDLEVBQW9ELEtBQXBELEVBREo7QUFFRDtBQUNGO0FBcEYyQztBQUFBO0FBQUEsaUNBc0ZuQyxHQXRGbUMsRUFzRjlCLEdBdEY4QixFQXNGekIsUUF0RnlCLEVBc0ZmO0FBQUEscUNBQ1YsS0FBSyxLQUFMLENBQVcsYUFBWCxDQUF5QixHQUF6QixFQUE4QixHQUE5QixDQURVOztBQUFBLGNBQ25CLENBRG1CLHdCQUNuQixDQURtQjtBQUFBLGNBQ2hCLENBRGdCLHdCQUNoQixDQURnQjs7QUFFM0IsZUFBSyxVQUFMLENBQ0ksS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixRQUFuQixFQUE2QixTQUE3QixDQUF1QyxDQUF2QyxFQUEwQyxDQUExQyxFQUE2QyxLQUE3QyxFQURKO0FBRUQ7QUExRjJDOztBQUFBO0FBQUE7QUFBQTtBQUFBLENBQWhEIiwiZmlsZSI6ImpzL2FwcC9waWN0dXJlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETyBMaW5lcyBsZW5ndGggY2FuIGJlIGNvcnJlY3RlZCB2aWEgcmVkdWNpbmcgZnJhbWVzLnRvdGFsXHJcbi8vIFRPRE8gTWF5YmUgdXNlIHNpbmdsZXRvbiBhbmQgY2hlY2sgaWYgaW5zdGFuY2UgaXMgaW5pdGlhbGl6ZWRcclxuLy8gVE9ETyBGdW5jdGlvbnMgaW4gaW5pdGlhbGl6ZSBtZXRob2QgYXJlIHVnbHksIG1heWJlIHJlZmFjdG9yIHRoZW1cclxuZGVmaW5lKFsnLi9jb25maWcnLCAnLi91dGlsaXRpZXMnLCAnLi9zcHJpdGUnXSwgKFxyXG4gICAgeyBnZW5lcmFsOiBjZmcsIHBsYXllcnMsIGVsZW1lbnRzOiB7IGxpbmUsIHNpZ24gfSB9LCB7IHJhbmRvbSB9LCBTcHJpdGUpID0+XHJcbiAgLy8gVmlzdWFsaXphdGlvbiBjbGFzc1xyXG4gIGNsYXNzIFBpY3R1cmUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGZpZWxkLCBjYW52YXMpIHtcclxuICAgICAgdGhpcy5maWVsZCA9IGZpZWxkO1xyXG4gICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICB0aGlzLnNwcml0ZXMgPSBuZXcgU2V0KCk7XHJcbiAgICAgIHRoaXMuYnVpbGRlcnMgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0aWFsaXplKGltYWdlcykge1xyXG4gICAgICBmdW5jdGlvbiBtYWtlQnVpbGRlcihpbWdJbmRleGVzKSB7XHJcbiAgICAgICAgY29uc3QgaW1ncyA9IGltZ0luZGV4ZXMubWFwKGlkID0+IGltYWdlc1tpZF0pO1xyXG4gICAgICAgIGltZ3NbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uIGl0ZXJhdGUoKSB7XHJcbiAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5leHQoKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHsgZG9uZTogZmFsc2UsIHZhbHVlOiByYW5kb20uaXRlbShzZWxmKSB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBuZXcgU3ByaXRlLlN0YW5kYXJkU3ByaXRlQnVpbGRlcihpbWdzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gY29sb3JpemUoY29sb3IsIHZhbHVlLCBpbmRleCkge1xyXG4gICAgICAgIHJldHVybiBjb2xvcltpbmRleCAlIDRdIHx8IHZhbHVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmJ1aWxkZXJzLmxpbmUgPSBsaW5lLmltZ0lELm1hcChhcnIgPT4gKFxyXG4gICAgICAgIG1ha2VCdWlsZGVyKGFycilcclxuICAgICAgICAgICAgLm1vZGlmeShjb2xvcml6ZS5iaW5kKG51bGwsIGxpbmUuY29sb3IpKVxyXG4gICAgICAgICAgICAuc2xpY2UobGluZS5mcmFtZXMudG90YWwsIGxpbmUuZnJhbWVzLmlubGluZSlcclxuICAgICAgICAgICAgLmZpdCh0aGlzLmZpZWxkLndpZHRoLCB0aGlzLmZpZWxkLmhlaWdodClcclxuICAgICAgICAgICAgLmRlbGF5KDEwMDAgLyBsaW5lLmZyYW1lcy5mcHMpXHJcbiAgICAgICAgICAgIC50cmFuc2xhdGUoKVxyXG4gICAgICAgICAgICAucm90YXRlKClcclxuICAgICAgICAgICAgLnNjYWxlKDEsIGNmZy5kZWZhdWx0Um93c0NvbHMgLyBNYXRoLm1heChjZmcucm93cywgY2ZnLmNvbHVtbnMpLFxyXG4gICAgICAgICAgICAgICAgdmFsID0+IHJhbmRvbS5zaWduICogdmFsICsgcmFuZG9tLmVycm9yKGxpbmUucmFuZG9tLnNjYWxlKSkpKTtcclxuXHJcbiAgICAgIHRoaXMuYnVpbGRlcnMuc2lnbiA9IHNpZ24uaW1nSUQubWFwKChhcnIsIGlkKSA9PiAoXHJcbiAgICAgICAgbWFrZUJ1aWxkZXIoYXJyKVxyXG4gICAgICAgICAgICAubW9kaWZ5KGNvbG9yaXplLmJpbmQobnVsbCwgcGxheWVyc1tpZF0uY29sb3IgfHwgc2lnbi5jb2xvcikpXHJcbiAgICAgICAgICAgIC5zbGljZShzaWduLmZyYW1lcy50b3RhbCwgc2lnbi5mcmFtZXMuaW5saW5lKVxyXG4gICAgICAgICAgICAuZml0KHRoaXMuZmllbGQuY2VsbC53aWR0aCwgdGhpcy5maWVsZC5jZWxsLmhlaWdodClcclxuICAgICAgICAgICAgLmRlbGF5KDEwMDAgLyBzaWduLmZyYW1lcy5mcHMpXHJcbiAgICAgICAgICAgIC50cmFuc2xhdGUodW5kZWZpbmVkLCB2YWwgPT4gdmFsICsgcmFuZG9tLmVycm9yKHNpZ24ucmFuZG9tLm1vdmUpKVxyXG4gICAgICAgICAgICAucm90YXRlKDAsIHZhbCA9PiB2YWwgKyByYW5kb20uZXJyb3Ioc2lnbi5yYW5kb20ucm90YXRlKSlcclxuICAgICAgICAgICAgLnNjYWxlKDEsIDEsXHJcbiAgICAgICAgICAgICAgICB2YWwgPT4gcmFuZG9tLnNpZ24gKiB2YWwgKyByYW5kb20uZXJyb3Ioc2lnbi5yYW5kb20uc2NhbGUpKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdTcHJpdGUoc3ByaXRlKSB7XHJcbiAgICAgIGNvbnN0IGNsZWFyQ2FudmFzID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCBkcmF3ID0gc3AgPT4ge1xyXG4gICAgICAgIHRoaXMuY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICBzcC50cmFuc2Zvcm1hdGlvbnMuZm9yRWFjaCgodmFsdWVzLCB0cmFuc2Zvcm1hdGlvbikgPT4gKFxyXG4gICAgICAgICAgICB0aGlzLmN0eFt0cmFuc2Zvcm1hdGlvbl0oLi4udmFsdWVzKSkpO1xyXG4gICAgICAgIHRoaXMuY3R4LmRyYXdJbWFnZSguLi5zcC5kcmF3QXJndW1lbnRzKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChzcHJpdGUgaW5zdGFuY2VvZiBTcHJpdGUuU3ByaXRlKSB0aGlzLnNwcml0ZXMuYWRkKHNwcml0ZSk7XHJcbiAgICAgIGVsc2UgdGhyb3cgbmV3IFR5cGVFcnJvcihgQXJndW1lbnQgaXMgbm90IGEgc3ByaXRlOiAke3Nwcml0ZX1gKTtcclxuICAgICAgY29uc3QgZG9uZSA9IHNwcml0ZS5uZXh0RnJhbWUoKTtcclxuICAgICAgaWYgKCFkb25lKSB7XHJcbiAgICAgICAgc2V0VGltZW91dCh0aGlzLmRyYXdTcHJpdGUuYmluZCh0aGlzLCBzcHJpdGUpLCBzcHJpdGUudGltaW5nKTtcclxuICAgICAgICBjbGVhckNhbnZhcygpO1xyXG4gICAgICAgIHRoaXMuc3ByaXRlcy5mb3JFYWNoKGRyYXcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0ZpZWxkKGxpbmVJRCA9IDApIHtcclxuICAgICAgaWYgKHRoaXMuZmllbGQubGluZXMudmlzaWJsZVtsaW5lSURdKSB7XHJcbiAgICAgICAgY29uc3QgeyB4LCB5LCBhbmdsZSB9ID0gdGhpcy5maWVsZC5saW5lcy52aXNpYmxlW2xpbmVJRF07XHJcbiAgICAgICAgc2V0VGltZW91dCh0aGlzLmRyYXdGaWVsZC5iaW5kKHRoaXMsIGxpbmVJRCArIDEpLCBsaW5lLnBhdXNlKTtcclxuICAgICAgICB0aGlzLmRyYXdTcHJpdGUoXHJcbiAgICAgICAgICAgIHRoaXMuYnVpbGRlcnMubGluZVswXS50cmFuc2xhdGUoeCwgeSkucm90YXRlKGFuZ2xlKS5idWlsZCgpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdTaWduKHJvdywgY29sLCBwbGF5ZXJJRCkge1xyXG4gICAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXMuZmllbGQuZ2V0Q2VsbENlbnRlcihyb3csIGNvbCk7XHJcbiAgICAgIHRoaXMuZHJhd1Nwcml0ZShcclxuICAgICAgICAgIHRoaXMuYnVpbGRlcnMuc2lnbltwbGF5ZXJJRF0udHJhbnNsYXRlKHgsIHkpLmJ1aWxkKCkpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcbik7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
