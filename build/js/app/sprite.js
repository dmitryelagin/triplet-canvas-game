'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Maybe implement opacity change
define(function () {
  // Builder interface

  var SpriteBuilder = function SpriteBuilder() {
    _classCallCheck(this, SpriteBuilder);
  };

  // Picture graphic element


  var Sprite = function () {
    function Sprite(builder) {
      _classCallCheck(this, Sprite);

      if (!(builder instanceof SpriteBuilder)) {
        throw new Error('Can not make sprite without builder: ' + builder);
      }
      this.image = builder.image;
      this.slicer = builder.slicer();
      this.dimentions = builder.dimentions;
      this.position = this.dimentions.map(function (d) {
        return -d / 2;
      });
      this.transformations = builder.transformations;
      this.timing = builder.timing;
      this.frame = [];
    }

    _createClass(Sprite, [{
      key: 'nextFrame',
      value: function nextFrame() {
        var frame = this.slicer.next();
        if (!frame.done) this.frame = frame.value;
        return frame.done;
      }
    }, {
      key: 'drawArguments',
      get: function get() {
        return [this.image].concat(this.frame, this.position, this.dimentions);
      }
    }]);

    return Sprite;
  }();

  // Builder for sprites


  var StandardSpriteBuilder = function (_SpriteBuilder) {
    _inherits(StandardSpriteBuilder, _SpriteBuilder);

    function StandardSpriteBuilder(images) {
      _classCallCheck(this, StandardSpriteBuilder);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(StandardSpriteBuilder).call(this));

      _this.images = (Array.isArray(images) ? images : [images]).filter(function (img) {
        return img instanceof Image;
      });
      _this.images[Symbol.iterator] = images[Symbol.iterator];
      _this.transform = new Map();
      _this.modified = [];
      if (!_this.images.length) {
        throw new Error('No images in builder: ' + images);
      }
      return _this;
    }

    _createClass(StandardSpriteBuilder, [{
      key: 'modify',
      value: function modify(modifier) {
        var _this2 = this;

        var makeCanvas = arguments.length <= 1 || arguments[1] === undefined ? function () {
          return document.createElement('canvas');
        } : arguments[1];
        var _images$ = this.images[0];
        var width = _images$.width;
        var height = _images$.height;

        var canvas = makeCanvas();
        var ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        function modifyImg(img) {
          return new Promise(function (resolve) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            var data = ctx.getImageData(0, 0, width, height).data.map(modifier);
            ctx.putImageData(new ImageData(data, width, height), 0, 0);
            var nImg = new Image();
            nImg.onload = function () {
              resolve(nImg);
            };
            nImg.src = canvas.toDataURL();
          });
        }

        Promise.all(this.images.map(modifyImg)).then(function (results) {
          _this2.images = results;
        }).catch(function (error) {
          _this2.error = error;
        }).then(function () {
          return _this2.modified.push(modifier);
        });
        return this;
      }
    }, {
      key: 'slice',
      value: function slice() {
        var total = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
        var inline = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

        var width = this.images[0].width / inline;
        var height = this.images[0].height / Math.ceil(total / inline);
        this.frames = { width: width, height: height, total: total, inline: inline };
        return this;
      }
    }, {
      key: 'slicer',
      value: regeneratorRuntime.mark(function slicer() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? this.shot : arguments[0];

        var width = _ref.width;
        var height = _ref.height;
        var _ref$total = _ref.total;
        var total = _ref$total === undefined ? 1 : _ref$total;
        var _ref$inline = _ref.inline;
        var inline = _ref$inline === undefined ? 1 : _ref$inline;
        var current, x, y;
        return regeneratorRuntime.wrap(function slicer$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                current = 0;

              case 1:
                if (!(current < total)) {
                  _context.next = 9;
                  break;
                }

                x = width * (current % inline);
                y = height * ~ ~(current / inline);
                _context.next = 6;
                return [x, y, width, height];

              case 6:
                current++;
                _context.next = 1;
                break;

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, slicer, this);
      })
    }, {
      key: 'delay',
      value: function delay() {
        var time = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        this.timing = time;
        return this;
      }
    }, {
      key: 'speed',
      value: function speed() {
        var time = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        this.timing = time / (this.frames ? this.frames.total : 1);
        return this;
      }
    }, {
      key: 'inscribe',
      value: function inscribe() {
        for (var _len = arguments.length, sizes = Array(_len), _key = 0; _key < _len; _key++) {
          sizes[_key] = arguments[_key];
        }

        this.dimentions = ['min', sizes];
        return this;
      }
    }, {
      key: 'fit',
      value: function fit() {
        for (var _len2 = arguments.length, sizes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          sizes[_key2] = arguments[_key2];
        }

        this.dimentions = ['max', sizes];
        return this;
      }
    }, {
      key: 'translate',
      value: function translate() {
        var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
        var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var decorate = arguments[2];

        this.transformations = ['translate', [x, y], decorate];
        return this;
      }
    }, {
      key: 'scale',
      value: function scale() {
        var width = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
        var height = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
        var decorate = arguments[2];

        this.transformations = ['scale', [width, height], decorate];
        return this;
      }
    }, {
      key: 'rotate',
      value: function rotate() {
        var angle = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
        var decorate = arguments[1];

        this.transformations = ['rotate', [angle], decorate];
        return this;
      }
    }, {
      key: 'build',
      value: function build(index) {
        this.index = index;
        return new Sprite(this);
      }
    }, {
      key: 'image',
      get: function get() {
        if (typeof this.index === 'number') return this.images[this.index];
        for (;;) {
          var img = this.selector ? this.selector.next() : { done: true };
          if (img.done) this.selector = this.images[Symbol.iterator]();else return img.value;
        }
      }
    }, {
      key: 'shot',
      get: function get() {
        return this.frames || this.images[0];
      }
    }, {
      key: 'timing',
      get: function get() {
        return this.time || 0;
      },
      set: function set(timing) {
        this.time = Math.round(timing) || 0;
      }
    }, {
      key: 'dimentions',
      get: function get() {
        var _shot = this.shot;
        var width = _shot.width;
        var height = _shot.height;

        var ratio = this.maxSize / Math.max(width, height) || 1;
        return [width * ratio, height * ratio];
      },
      set: function set(_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2);

        var type = _ref3[0];
        var sizes = _ref3[1];

        var size = Math[type].apply(Math, _toConsumableArray(sizes.map(function (n) {
          return Math.round(n);
        }).filter(function (n) {
          return Number.isFinite(n);
        })));
        if (size) this.maxSize = size;
      }
    }, {
      key: 'transformations',
      get: function get() {
        var map = new Map();
        this.transform.forEach(function (value, key) {
          return map.set(key, value.args.map(function (val, i) {
            return value.decorate(val, i);
          }));
        });
        return map;
      },
      set: function set(_ref4) {
        var _ref5 = _slicedToArray(_ref4, 3);

        var key = _ref5[0];
        var arg = _ref5[1];
        var dec = _ref5[2];

        var args = arg.map(function (v) {
          return parseFloat(v) || 0;
        });
        var decorate = function decorate(val) {
          return val;
        };
        if (this.transform.has(key)) decorate = this.transform.get(key).decorate;
        if (typeof dec === 'function' && Number.isFinite(dec(0))) decorate = dec;
        this.transform.set(key, { args: args, decorate: decorate });
      }
    }]);

    return StandardSpriteBuilder;
  }(SpriteBuilder);

  return { SpriteBuilder: SpriteBuilder, Sprite: Sprite, StandardSpriteBuilder: StandardSpriteBuilder };
});
//# sourceMappingURL=data:application/json;base64,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WyIvLyBUT0RPIE1heWJlIGltcGxlbWVudCBvcGFjaXR5IGNoYW5nZVxyXG5kZWZpbmUoKCkgPT4ge1xyXG4gIC8vIEJ1aWxkZXIgaW50ZXJmYWNlXHJcbiAgY2xhc3MgU3ByaXRlQnVpbGRlciB7fVxyXG5cclxuICAvLyBQaWN0dXJlIGdyYXBoaWMgZWxlbWVudFxyXG4gIGNsYXNzIFNwcml0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYnVpbGRlcikge1xyXG4gICAgICBpZiAoIShidWlsZGVyIGluc3RhbmNlb2YgU3ByaXRlQnVpbGRlcikpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbiBub3QgbWFrZSBzcHJpdGUgd2l0aG91dCBidWlsZGVyOiAke2J1aWxkZXJ9YCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5pbWFnZSA9IGJ1aWxkZXIuaW1hZ2U7XHJcbiAgICAgIHRoaXMuc2xpY2VyID0gYnVpbGRlci5zbGljZXIoKTtcclxuICAgICAgdGhpcy5kaW1lbnRpb25zID0gYnVpbGRlci5kaW1lbnRpb25zO1xyXG4gICAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5kaW1lbnRpb25zLm1hcChkID0+IC1kIC8gMik7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtYXRpb25zID0gYnVpbGRlci50cmFuc2Zvcm1hdGlvbnM7XHJcbiAgICAgIHRoaXMudGltaW5nID0gYnVpbGRlci50aW1pbmc7XHJcbiAgICAgIHRoaXMuZnJhbWUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBuZXh0RnJhbWUoKSB7XHJcbiAgICAgIGNvbnN0IGZyYW1lID0gdGhpcy5zbGljZXIubmV4dCgpO1xyXG4gICAgICBpZiAoIWZyYW1lLmRvbmUpIHRoaXMuZnJhbWUgPSBmcmFtZS52YWx1ZTtcclxuICAgICAgcmV0dXJuIGZyYW1lLmRvbmU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGRyYXdBcmd1bWVudHMoKSB7XHJcbiAgICAgIHJldHVybiBbdGhpcy5pbWFnZV0uY29uY2F0KHRoaXMuZnJhbWUsIHRoaXMucG9zaXRpb24sIHRoaXMuZGltZW50aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQnVpbGRlciBmb3Igc3ByaXRlc1xyXG4gIGNsYXNzIFN0YW5kYXJkU3ByaXRlQnVpbGRlciBleHRlbmRzIFNwcml0ZUJ1aWxkZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGltYWdlcykge1xyXG4gICAgICBzdXBlcigpO1xyXG4gICAgICB0aGlzLmltYWdlcyA9IChBcnJheS5pc0FycmF5KGltYWdlcykgPyBpbWFnZXMgOiBbaW1hZ2VzXSlcclxuICAgICAgICAgIC5maWx0ZXIoaW1nID0+IGltZyBpbnN0YW5jZW9mIEltYWdlKTtcclxuICAgICAgdGhpcy5pbWFnZXNbU3ltYm9sLml0ZXJhdG9yXSA9IGltYWdlc1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgICB0aGlzLnRyYW5zZm9ybSA9IG5ldyBNYXAoKTtcclxuICAgICAgdGhpcy5tb2RpZmllZCA9IFtdO1xyXG4gICAgICBpZiAoIXRoaXMuaW1hZ2VzLmxlbmd0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gaW1hZ2VzIGluIGJ1aWxkZXI6ICR7aW1hZ2VzfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGltYWdlKCkge1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMuaW5kZXggPT09ICdudW1iZXInKSByZXR1cm4gdGhpcy5pbWFnZXNbdGhpcy5pbmRleF07XHJcbiAgICAgIGZvciAoOzspIHtcclxuICAgICAgICBjb25zdCBpbWcgPSB0aGlzLnNlbGVjdG9yID8gdGhpcy5zZWxlY3Rvci5uZXh0KCkgOiB7IGRvbmU6IHRydWUgfTtcclxuICAgICAgICBpZiAoaW1nLmRvbmUpIHRoaXMuc2VsZWN0b3IgPSB0aGlzLmltYWdlc1tTeW1ib2wuaXRlcmF0b3JdKCk7XHJcbiAgICAgICAgZWxzZSByZXR1cm4gaW1nLnZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW9kaWZ5KG1vZGlmaWVyLCBtYWtlQ2FudmFzID0gKCkgPT4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykpIHtcclxuICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSB0aGlzLmltYWdlc1swXTtcclxuICAgICAgY29uc3QgY2FudmFzID0gbWFrZUNhbnZhcygpO1xyXG4gICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb2RpZnlJbWcoaW1nKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XHJcbiAgICAgICAgICBjb25zdCBkYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KS5kYXRhLm1hcChtb2RpZmllcik7XHJcbiAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKG5ldyBJbWFnZURhdGEoZGF0YSwgd2lkdGgsIGhlaWdodCksIDAsIDApO1xyXG4gICAgICAgICAgY29uc3QgbkltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgbkltZy5vbmxvYWQgPSAoKSA9PiB7IHJlc29sdmUobkltZyk7IH07XHJcbiAgICAgICAgICBuSW1nLnNyYyA9IGNhbnZhcy50b0RhdGFVUkwoKTtcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFByb21pc2UuYWxsKHRoaXMuaW1hZ2VzLm1hcChtb2RpZnlJbWcpKVxyXG4gICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7IHRoaXMuaW1hZ2VzID0gcmVzdWx0czsgfSlcclxuICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7IHRoaXMuZXJyb3IgPSBlcnJvcjsgfSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMubW9kaWZpZWQucHVzaChtb2RpZmllcikpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2hvdCgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZnJhbWVzIHx8IHRoaXMuaW1hZ2VzWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIHNsaWNlKHRvdGFsID0gMSwgaW5saW5lID0gMSkge1xyXG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuaW1hZ2VzWzBdLndpZHRoIC8gaW5saW5lO1xyXG4gICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmltYWdlc1swXS5oZWlnaHQgLyBNYXRoLmNlaWwodG90YWwgLyBpbmxpbmUpO1xyXG4gICAgICB0aGlzLmZyYW1lcyA9IHsgd2lkdGgsIGhlaWdodCwgdG90YWwsIGlubGluZSB9O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAqIHNsaWNlcih7IHdpZHRoLCBoZWlnaHQsIHRvdGFsID0gMSwgaW5saW5lID0gMSB9ID0gdGhpcy5zaG90KSB7XHJcbiAgICAgIGZvciAobGV0IGN1cnJlbnQgPSAwOyBjdXJyZW50IDwgdG90YWw7IGN1cnJlbnQrKykge1xyXG4gICAgICAgIGNvbnN0IHggPSB3aWR0aCAqIChjdXJyZW50ICUgaW5saW5lKTtcclxuICAgICAgICBjb25zdCB5ID0gaGVpZ2h0ICogfn4oY3VycmVudCAvIGlubGluZSk7XHJcbiAgICAgICAgeWllbGQgW3gsIHksIHdpZHRoLCBoZWlnaHRdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRpbWluZygpIHtcclxuICAgICAgcmV0dXJuIHRoaXMudGltZSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB0aW1pbmcodGltaW5nKSB7XHJcbiAgICAgIHRoaXMudGltZSA9IE1hdGgucm91bmQodGltaW5nKSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGRlbGF5KHRpbWUgPSAwKSB7XHJcbiAgICAgIHRoaXMudGltaW5nID0gdGltZTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc3BlZWQodGltZSA9IDApIHtcclxuICAgICAgdGhpcy50aW1pbmcgPSB0aW1lIC8gKHRoaXMuZnJhbWVzID8gdGhpcy5mcmFtZXMudG90YWwgOiAxKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGRpbWVudGlvbnMoKSB7XHJcbiAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gdGhpcy5zaG90O1xyXG4gICAgICBjb25zdCByYXRpbyA9IHRoaXMubWF4U2l6ZSAvIE1hdGgubWF4KHdpZHRoLCBoZWlnaHQpIHx8IDE7XHJcbiAgICAgIHJldHVybiBbd2lkdGggKiByYXRpbywgaGVpZ2h0ICogcmF0aW9dO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBkaW1lbnRpb25zKFt0eXBlLCBzaXplc10pIHtcclxuICAgICAgY29uc3Qgc2l6ZSA9IE1hdGhbdHlwZV0oXHJcbiAgICAgICAgICAuLi5zaXplcy5tYXAobiA9PiBNYXRoLnJvdW5kKG4pKS5maWx0ZXIobiA9PiBOdW1iZXIuaXNGaW5pdGUobikpKTtcclxuICAgICAgaWYgKHNpemUpIHRoaXMubWF4U2l6ZSA9IHNpemU7XHJcbiAgICB9XHJcblxyXG4gICAgaW5zY3JpYmUoLi4uc2l6ZXMpIHtcclxuICAgICAgdGhpcy5kaW1lbnRpb25zID0gWydtaW4nLCBzaXplc107XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGZpdCguLi5zaXplcykge1xyXG4gICAgICB0aGlzLmRpbWVudGlvbnMgPSBbJ21heCcsIHNpemVzXTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRyYW5zZm9ybWF0aW9ucygpIHtcclxuICAgICAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xyXG4gICAgICB0aGlzLnRyYW5zZm9ybS5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiAoXHJcbiAgICAgICAgICBtYXAuc2V0KGtleSwgdmFsdWUuYXJncy5tYXAoKHZhbCwgaSkgPT4gdmFsdWUuZGVjb3JhdGUodmFsLCBpKSkpKSk7XHJcbiAgICAgIHJldHVybiBtYXA7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHRyYW5zZm9ybWF0aW9ucyhba2V5LCBhcmcsIGRlY10pIHtcclxuICAgICAgY29uc3QgYXJncyA9IGFyZy5tYXAodiA9PiBwYXJzZUZsb2F0KHYpIHx8IDApO1xyXG4gICAgICBsZXQgZGVjb3JhdGUgPSB2YWwgPT4gdmFsO1xyXG4gICAgICBpZiAodGhpcy50cmFuc2Zvcm0uaGFzKGtleSkpIGRlY29yYXRlID0gdGhpcy50cmFuc2Zvcm0uZ2V0KGtleSkuZGVjb3JhdGU7XHJcbiAgICAgIGlmICh0eXBlb2YgZGVjID09PSAnZnVuY3Rpb24nICYmIE51bWJlci5pc0Zpbml0ZShkZWMoMCkpKSBkZWNvcmF0ZSA9IGRlYztcclxuICAgICAgdGhpcy50cmFuc2Zvcm0uc2V0KGtleSwgeyBhcmdzLCBkZWNvcmF0ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0cmFuc2xhdGUoeCA9IDAsIHkgPSAwLCBkZWNvcmF0ZSkge1xyXG4gICAgICB0aGlzLnRyYW5zZm9ybWF0aW9ucyA9IFsndHJhbnNsYXRlJywgW3gsIHldLCBkZWNvcmF0ZV07XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNjYWxlKHdpZHRoID0gMSwgaGVpZ2h0ID0gMSwgZGVjb3JhdGUpIHtcclxuICAgICAgdGhpcy50cmFuc2Zvcm1hdGlvbnMgPSBbJ3NjYWxlJywgW3dpZHRoLCBoZWlnaHRdLCBkZWNvcmF0ZV07XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHJvdGF0ZShhbmdsZSA9IDAsIGRlY29yYXRlKSB7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtYXRpb25zID0gWydyb3RhdGUnLCBbYW5nbGVdLCBkZWNvcmF0ZV07XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkKGluZGV4KSB7XHJcbiAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcclxuICAgICAgcmV0dXJuIG5ldyBTcHJpdGUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgU3ByaXRlQnVpbGRlciwgU3ByaXRlLCBTdGFuZGFyZFNwcml0ZUJ1aWxkZXIgfTtcclxufSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
