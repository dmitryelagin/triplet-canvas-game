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
      if (!_this.images.length) {
        throw new Error('No images in builder: ' + images);
      }
      return _this;
    }

    _createClass(StandardSpriteBuilder, [{
      key: 'modify',
      value: function modify(modifierFn) {
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
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
          var data = ctx.getImageData(0, 0, width, height).data.map(modifierFn);
          ctx.putImageData(new ImageData(data, width, height), 0, 0);
          var nImg = new Image();
          nImg.src = canvas.toDataURL('image/png');
          return nImg;
        }

        try {
          this.images = this.images.map(modifyImg);
        } catch (err) {
          this.error = err;
        }
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
//# sourceMappingURL=data:application/json;base64,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LENBQXBCLENBQVo7QUFBQSxXQUFmLENBQWIsQ0FEbUI7QUFBQSxTQUF2QjtBQUVBLGVBQU8sR0FBUDtBQUNELE9BaEpRO0FBQUEsK0JBa0o0QjtBQUFBOztBQUFBLFlBQWhCLEdBQWdCO0FBQUEsWUFBWCxHQUFXO0FBQUEsWUFBTixHQUFNOztBQUNuQyxZQUFNLE9BQU8sSUFBSSxHQUFKLENBQVE7QUFBQSxpQkFBSyxXQUFXLENBQVgsS0FBaUIsQ0FBdEI7QUFBQSxTQUFSLENBQWI7QUFDQSxZQUFJLFdBQVc7QUFBQSxpQkFBTyxHQUFQO0FBQUEsU0FBZjtBQUNBLFlBQUksS0FBSyxTQUFMLENBQWUsR0FBZixDQUFtQixHQUFuQixDQUFKLEVBQTZCLFdBQVcsS0FBSyxTQUFMLENBQWUsR0FBZixDQUFtQixHQUFuQixFQUF3QixRQUFuQztBQUM3QixZQUFJLE9BQU8sR0FBUCxLQUFlLFVBQWYsSUFBNkIsT0FBTyxRQUFQLENBQWdCLElBQUksQ0FBSixDQUFoQixDQUFqQyxFQUEwRCxXQUFXLEdBQVg7QUFDMUQsYUFBSyxTQUFMLENBQWUsR0FBZixDQUFtQixHQUFuQixFQUF3QixFQUFFLFVBQUYsRUFBUSxrQkFBUixFQUF4QjtBQUNEO0FBeEpROztBQUFBO0FBQUEsSUFpQ3lCLGFBakN6Qjs7QUFnTFgsU0FBTyxFQUFFLDRCQUFGLEVBQWlCLGNBQWpCLEVBQXlCLDRDQUF6QixFQUFQO0FBQ0QsQ0FqTEQiLCJmaWxlIjoianMvYXBwL3Nwcml0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gTWF5YmUgaW1wbGVtZW50IG9wYWNpdHkgY2hhbmdlXHJcbmRlZmluZSgoKSA9PiB7XHJcbiAgLy8gQnVpbGRlciBpbnRlcmZhY2VcclxuICBjbGFzcyBTcHJpdGVCdWlsZGVyIHt9XHJcblxyXG4gIC8vIFBpY3R1cmUgZ3JhcGhpYyBlbGVtZW50XHJcbiAgY2xhc3MgU3ByaXRlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihidWlsZGVyKSB7XHJcbiAgICAgIGlmICghKGJ1aWxkZXIgaW5zdGFuY2VvZiBTcHJpdGVCdWlsZGVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2FuIG5vdCBtYWtlIHNwcml0ZSB3aXRob3V0IGJ1aWxkZXI6ICR7YnVpbGRlcn1gKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmltYWdlID0gYnVpbGRlci5pbWFnZTtcclxuICAgICAgdGhpcy5zbGljZXIgPSBidWlsZGVyLnNsaWNlcigpO1xyXG4gICAgICB0aGlzLmRpbWVudGlvbnMgPSBidWlsZGVyLmRpbWVudGlvbnM7XHJcbiAgICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLmRpbWVudGlvbnMubWFwKGQgPT4gLWQgLyAyKTtcclxuICAgICAgdGhpcy50cmFuc2Zvcm1hdGlvbnMgPSBidWlsZGVyLnRyYW5zZm9ybWF0aW9ucztcclxuICAgICAgdGhpcy50aW1pbmcgPSBidWlsZGVyLnRpbWluZztcclxuICAgICAgdGhpcy5mcmFtZSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIG5leHRGcmFtZSgpIHtcclxuICAgICAgY29uc3QgZnJhbWUgPSB0aGlzLnNsaWNlci5uZXh0KCk7XHJcbiAgICAgIGlmICghZnJhbWUuZG9uZSkgdGhpcy5mcmFtZSA9IGZyYW1lLnZhbHVlO1xyXG4gICAgICByZXR1cm4gZnJhbWUuZG9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZHJhd0FyZ3VtZW50cygpIHtcclxuICAgICAgcmV0dXJuIFt0aGlzLmltYWdlXS5jb25jYXQodGhpcy5mcmFtZSwgdGhpcy5wb3NpdGlvbiwgdGhpcy5kaW1lbnRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICAvLyBCdWlsZGVyIGZvciBzcHJpdGVzXHJcbiAgY2xhc3MgU3RhbmRhcmRTcHJpdGVCdWlsZGVyIGV4dGVuZHMgU3ByaXRlQnVpbGRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaW1hZ2VzKSB7XHJcbiAgICAgIHN1cGVyKCk7XHJcbiAgICAgIHRoaXMuaW1hZ2VzID0gKEFycmF5LmlzQXJyYXkoaW1hZ2VzKSA/IGltYWdlcyA6IFtpbWFnZXNdKVxyXG4gICAgICAgICAgLmZpbHRlcihpbWcgPT4gaW1nIGluc3RhbmNlb2YgSW1hZ2UpO1xyXG4gICAgICB0aGlzLmltYWdlc1tTeW1ib2wuaXRlcmF0b3JdID0gaW1hZ2VzW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtID0gbmV3IE1hcCgpO1xyXG4gICAgICBpZiAoIXRoaXMuaW1hZ2VzLmxlbmd0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gaW1hZ2VzIGluIGJ1aWxkZXI6ICR7aW1hZ2VzfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGltYWdlKCkge1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMuaW5kZXggPT09ICdudW1iZXInKSByZXR1cm4gdGhpcy5pbWFnZXNbdGhpcy5pbmRleF07XHJcbiAgICAgIGZvciAoOzspIHtcclxuICAgICAgICBjb25zdCBpbWcgPSB0aGlzLnNlbGVjdG9yID8gdGhpcy5zZWxlY3Rvci5uZXh0KCkgOiB7IGRvbmU6IHRydWUgfTtcclxuICAgICAgICBpZiAoaW1nLmRvbmUpIHRoaXMuc2VsZWN0b3IgPSB0aGlzLmltYWdlc1tTeW1ib2wuaXRlcmF0b3JdKCk7XHJcbiAgICAgICAgZWxzZSByZXR1cm4gaW1nLnZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW9kaWZ5KG1vZGlmaWVyRm4sIG1ha2VDYW52YXMgPSAoKSA9PiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSkge1xyXG4gICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHRoaXMuaW1hZ2VzWzBdO1xyXG4gICAgICBjb25zdCBjYW52YXMgPSBtYWtlQ2FudmFzKCk7XHJcbiAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIG1vZGlmeUltZyhpbWcpIHtcclxuICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcclxuICAgICAgICBjb25zdCBkYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KS5kYXRhLm1hcChtb2RpZmllckZuKTtcclxuICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKG5ldyBJbWFnZURhdGEoZGF0YSwgd2lkdGgsIGhlaWdodCksIDAsIDApO1xyXG4gICAgICAgIGNvbnN0IG5JbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICBuSW1nLnNyYyA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgIHJldHVybiBuSW1nO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHRoaXMuaW1hZ2VzID0gdGhpcy5pbWFnZXMubWFwKG1vZGlmeUltZyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHRoaXMuZXJyb3IgPSBlcnI7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNob3QoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmZyYW1lcyB8fCB0aGlzLmltYWdlc1swXTtcclxuICAgIH1cclxuXHJcbiAgICBzbGljZSh0b3RhbCA9IDEsIGlubGluZSA9IDEpIHtcclxuICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmltYWdlc1swXS53aWR0aCAvIGlubGluZTtcclxuICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5pbWFnZXNbMF0uaGVpZ2h0IC8gTWF0aC5jZWlsKHRvdGFsIC8gaW5saW5lKTtcclxuICAgICAgdGhpcy5mcmFtZXMgPSB7IHdpZHRoLCBoZWlnaHQsIHRvdGFsLCBpbmxpbmUgfTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgKiBzbGljZXIoeyB3aWR0aCwgaGVpZ2h0LCB0b3RhbCA9IDEsIGlubGluZSA9IDEgfSA9IHRoaXMuc2hvdCkge1xyXG4gICAgICBmb3IgKGxldCBjdXJyZW50ID0gMDsgY3VycmVudCA8IHRvdGFsOyBjdXJyZW50KyspIHtcclxuICAgICAgICBjb25zdCB4ID0gd2lkdGggKiAoY3VycmVudCAlIGlubGluZSk7XHJcbiAgICAgICAgY29uc3QgeSA9IGhlaWdodCAqIH5+KGN1cnJlbnQgLyBpbmxpbmUpO1xyXG4gICAgICAgIHlpZWxkIFt4LCB5LCB3aWR0aCwgaGVpZ2h0XTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB0aW1pbmcoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnRpbWUgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgdGltaW5nKHRpbWluZykge1xyXG4gICAgICB0aGlzLnRpbWUgPSBNYXRoLnJvdW5kKHRpbWluZykgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBkZWxheSh0aW1lID0gMCkge1xyXG4gICAgICB0aGlzLnRpbWluZyA9IHRpbWU7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNwZWVkKHRpbWUgPSAwKSB7XHJcbiAgICAgIHRoaXMudGltaW5nID0gdGltZSAvICh0aGlzLmZyYW1lcyA/IHRoaXMuZnJhbWVzLnRvdGFsIDogMSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkaW1lbnRpb25zKCkge1xyXG4gICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHRoaXMuc2hvdDtcclxuICAgICAgY29uc3QgcmF0aW8gPSB0aGlzLm1heFNpemUgLyBNYXRoLm1heCh3aWR0aCwgaGVpZ2h0KSB8fCAxO1xyXG4gICAgICByZXR1cm4gW3dpZHRoICogcmF0aW8sIGhlaWdodCAqIHJhdGlvXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgZGltZW50aW9ucyhbdHlwZSwgc2l6ZXNdKSB7XHJcbiAgICAgIGNvbnN0IHNpemUgPSBNYXRoW3R5cGVdKFxyXG4gICAgICAgICAgLi4uc2l6ZXMubWFwKG4gPT4gTWF0aC5yb3VuZChuKSkuZmlsdGVyKG4gPT4gTnVtYmVyLmlzRmluaXRlKG4pKSk7XHJcbiAgICAgIGlmIChzaXplKSB0aGlzLm1heFNpemUgPSBzaXplO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2NyaWJlKC4uLnNpemVzKSB7XHJcbiAgICAgIHRoaXMuZGltZW50aW9ucyA9IFsnbWluJywgc2l6ZXNdO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBmaXQoLi4uc2l6ZXMpIHtcclxuICAgICAgdGhpcy5kaW1lbnRpb25zID0gWydtYXgnLCBzaXplc107XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0cmFuc2Zvcm1hdGlvbnMoKSB7XHJcbiAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcclxuICAgICAgdGhpcy50cmFuc2Zvcm0uZm9yRWFjaCgodmFsdWUsIGtleSkgPT4gKFxyXG4gICAgICAgICAgbWFwLnNldChrZXksIHZhbHVlLmFyZ3MubWFwKCh2YWwsIGkpID0+IHZhbHVlLmRlY29yYXRlKHZhbCwgaSkpKSkpO1xyXG4gICAgICByZXR1cm4gbWFwO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB0cmFuc2Zvcm1hdGlvbnMoW2tleSwgYXJnLCBkZWNdKSB7XHJcbiAgICAgIGNvbnN0IGFyZ3MgPSBhcmcubWFwKHYgPT4gcGFyc2VGbG9hdCh2KSB8fCAwKTtcclxuICAgICAgbGV0IGRlY29yYXRlID0gdmFsID0+IHZhbDtcclxuICAgICAgaWYgKHRoaXMudHJhbnNmb3JtLmhhcyhrZXkpKSBkZWNvcmF0ZSA9IHRoaXMudHJhbnNmb3JtLmdldChrZXkpLmRlY29yYXRlO1xyXG4gICAgICBpZiAodHlwZW9mIGRlYyA9PT0gJ2Z1bmN0aW9uJyAmJiBOdW1iZXIuaXNGaW5pdGUoZGVjKDApKSkgZGVjb3JhdGUgPSBkZWM7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtLnNldChrZXksIHsgYXJncywgZGVjb3JhdGUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJhbnNsYXRlKHggPSAwLCB5ID0gMCwgZGVjb3JhdGUpIHtcclxuICAgICAgdGhpcy50cmFuc2Zvcm1hdGlvbnMgPSBbJ3RyYW5zbGF0ZScsIFt4LCB5XSwgZGVjb3JhdGVdO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzY2FsZSh3aWR0aCA9IDEsIGhlaWdodCA9IDEsIGRlY29yYXRlKSB7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtYXRpb25zID0gWydzY2FsZScsIFt3aWR0aCwgaGVpZ2h0XSwgZGVjb3JhdGVdO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICByb3RhdGUoYW5nbGUgPSAwLCBkZWNvcmF0ZSkge1xyXG4gICAgICB0aGlzLnRyYW5zZm9ybWF0aW9ucyA9IFsncm90YXRlJywgW2FuZ2xlXSwgZGVjb3JhdGVdO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBidWlsZChpbmRleCkge1xyXG4gICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XHJcbiAgICAgIHJldHVybiBuZXcgU3ByaXRlKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIHJldHVybiB7IFNwcml0ZUJ1aWxkZXIsIFNwcml0ZSwgU3RhbmRhcmRTcHJpdGVCdWlsZGVyIH07XHJcbn0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
