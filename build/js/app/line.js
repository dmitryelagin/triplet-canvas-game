"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Ucomment exponentiation operator later
// Lines class, using slope–intercept form for setup
define(function () {
  return function () {
    function Line(_ref) {
      var _this = this;

      var _ref$x = _ref.x;
      var x = _ref$x === undefined ? 0 : _ref$x;
      var _ref$y = _ref.y;
      var y = _ref$y === undefined ? 0 : _ref$y;
      var _ref$angle = _ref.angle;
      var angle = _ref$angle === undefined ? 0 : _ref$angle;

      _classCallCheck(this, Line);

      this.angle = parseFloat(angle) % (Math.PI * 2);
      this.x = parseFloat(x);
      this.y = parseFloat(y);
      this.a = Math.tan(this.angle);
      this.b = -1;
      this.c = this.y - this.a * this.x;
      if (Object.keys(this).every(function (p) {
        return Number.isFinite(_this[p]);
      })) {
        Object.freeze(this);
      } else throw new Error("Wrong line setup: " + x + " / " + y + " / " + angle);
    }

    _createClass(Line, [{
      key: "distanceFrom",
      value: function distanceFrom() {
        var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
        var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var a = this.a;
        var b = this.b;
        var c = this.c;
        // const distance = (a * x + b * y + c) / Math.sqrt(a ** 2 + b ** 2);

        var distance = (a * x + b * y + c) / Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
        if (Number.isFinite(distance)) return distance;
        throw new Error("Wrong point coordinates: " + x + " / " + y);
      }
    }, {
      key: "intersects",
      value: function intersects(line) {
        var accuracy = arguments.length <= 1 || arguments[1] === undefined ? 8 : arguments[1];

        this.constructor.isLine(line);
        var divider = this.a * line.b - line.a * this.b;
        return divider === 0 ? null : {
          x: -((this.c * line.b - line.c * this.b) / divider).toFixed(accuracy),
          y: -((this.a * line.c - line.a * this.c) / divider).toFixed(accuracy)
        };
      }
    }, {
      key: "getBisector",
      value: function getBisector(line) {
        this.constructor.isLine(line);
        return new Line({
          x: (this.x + line.x) / 2,
          y: (this.y + line.y) / 2,
          angle: (this.angle + line.angle) / 2
        });
      }
    }], [{
      key: "isLine",
      value: function isLine(line) {
        if (line instanceof Line) return line;
        throw new TypeError("Argument is not instance of Line: " + line);
      }
    }]);

    return Line;
  }();
});
//# sourceMappingURL=data:application/json;base64,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S0FBSyxDQUFmLElBQW9CLENBRFQ7QUFFZCxhQUFHLENBQUMsS0FBSyxDQUFMLEdBQVMsS0FBSyxDQUFmLElBQW9CLENBRlQ7QUFHZCxpQkFBTyxDQUFDLEtBQUssS0FBTCxHQUFhLEtBQUssS0FBbkIsSUFBNEI7QUFIckIsU0FBVCxDQUFQO0FBS0Q7QUE3Q0U7QUFBQTtBQUFBLDZCQWVXLElBZlgsRUFlaUI7QUFDbEIsWUFBSSxnQkFBZ0IsSUFBcEIsRUFBMEIsT0FBTyxJQUFQO0FBQzFCLGNBQU0sSUFBSSxTQUFKLHdDQUFtRCxJQUFuRCxDQUFOO0FBQ0Q7QUFsQkU7O0FBQUE7QUFBQTtBQUFBLENBQVAiLCJmaWxlIjoianMvYXBwL2xpbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIFVjb21tZW50IGV4cG9uZW50aWF0aW9uIG9wZXJhdG9yIGxhdGVyXHJcbi8vIExpbmVzIGNsYXNzLCB1c2luZyBzbG9wZeKAk2ludGVyY2VwdCBmb3JtIGZvciBzZXR1cFxyXG5kZWZpbmUoKCkgPT5cclxuICBjbGFzcyBMaW5lIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih7IHggPSAwLCB5ID0gMCwgYW5nbGUgPSAwIH0pIHtcclxuICAgICAgdGhpcy5hbmdsZSA9IHBhcnNlRmxvYXQoYW5nbGUpICUgKE1hdGguUEkgKiAyKTtcclxuICAgICAgdGhpcy54ID0gcGFyc2VGbG9hdCh4KTtcclxuICAgICAgdGhpcy55ID0gcGFyc2VGbG9hdCh5KTtcclxuICAgICAgdGhpcy5hID0gTWF0aC50YW4odGhpcy5hbmdsZSk7XHJcbiAgICAgIHRoaXMuYiA9IC0xO1xyXG4gICAgICB0aGlzLmMgPSB0aGlzLnkgLSB0aGlzLmEgKiB0aGlzLng7XHJcbiAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzKS5ldmVyeShwID0+IE51bWJlci5pc0Zpbml0ZSh0aGlzW3BdKSkpIHtcclxuICAgICAgICBPYmplY3QuZnJlZXplKHRoaXMpO1xyXG4gICAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKGBXcm9uZyBsaW5lIHNldHVwOiAke3h9IC8gJHt5fSAvICR7YW5nbGV9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGlzTGluZShsaW5lKSB7XHJcbiAgICAgIGlmIChsaW5lIGluc3RhbmNlb2YgTGluZSkgcmV0dXJuIGxpbmU7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEFyZ3VtZW50IGlzIG5vdCBpbnN0YW5jZSBvZiBMaW5lOiAke2xpbmV9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzdGFuY2VGcm9tKHggPSAwLCB5ID0gMCkge1xyXG4gICAgICBjb25zdCB7IGEsIGIsIGMgfSA9IHRoaXM7XHJcbiAgICAgIC8vIGNvbnN0IGRpc3RhbmNlID0gKGEgKiB4ICsgYiAqIHkgKyBjKSAvIE1hdGguc3FydChhICoqIDIgKyBiICoqIDIpO1xyXG4gICAgICBjb25zdCBkaXN0YW5jZSA9IChhICogeCArIGIgKiB5ICsgYykgL1xyXG4gICAgICAgICAgTWF0aC5zcXJ0KE1hdGgucG93KGEsIDIpICsgTWF0aC5wb3coYiwgMikpO1xyXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGRpc3RhbmNlKSkgcmV0dXJuIGRpc3RhbmNlO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFdyb25nIHBvaW50IGNvb3JkaW5hdGVzOiAke3h9IC8gJHt5fWApO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyc2VjdHMobGluZSwgYWNjdXJhY3kgPSA4KSB7XHJcbiAgICAgIHRoaXMuY29uc3RydWN0b3IuaXNMaW5lKGxpbmUpO1xyXG4gICAgICBjb25zdCBkaXZpZGVyID0gdGhpcy5hICogbGluZS5iIC0gbGluZS5hICogdGhpcy5iO1xyXG4gICAgICByZXR1cm4gZGl2aWRlciA9PT0gMCA/IG51bGwgOiB7XHJcbiAgICAgICAgeDogLSgodGhpcy5jICogbGluZS5iIC0gbGluZS5jICogdGhpcy5iKSAvIGRpdmlkZXIpLnRvRml4ZWQoYWNjdXJhY3kpLFxyXG4gICAgICAgIHk6IC0oKHRoaXMuYSAqIGxpbmUuYyAtIGxpbmUuYSAqIHRoaXMuYykgLyBkaXZpZGVyKS50b0ZpeGVkKGFjY3VyYWN5KSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRCaXNlY3RvcihsaW5lKSB7XHJcbiAgICAgIHRoaXMuY29uc3RydWN0b3IuaXNMaW5lKGxpbmUpO1xyXG4gICAgICByZXR1cm4gbmV3IExpbmUoe1xyXG4gICAgICAgIHg6ICh0aGlzLnggKyBsaW5lLngpIC8gMixcclxuICAgICAgICB5OiAodGhpcy55ICsgbGluZS55KSAvIDIsXHJcbiAgICAgICAgYW5nbGU6ICh0aGlzLmFuZ2xlICsgbGluZS5hbmdsZSkgLyAyLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
