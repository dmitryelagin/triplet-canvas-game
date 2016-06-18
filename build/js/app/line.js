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
//# sourceMappingURL=data:application/json;base64,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UyxLQUFLLENBQWYsSUFBb0IsQ0FEVDtBQUVkLGFBQUcsQ0FBQyxLQUFLLENBQUwsR0FBUyxLQUFLLENBQWYsSUFBb0IsQ0FGVDtBQUdkLGlCQUFPLENBQUMsS0FBSyxLQUFMLEdBQWEsS0FBSyxLQUFuQixJQUE0QjtBQUhyQixTQUFULENBQVA7QUFLRDtBQTVDRTtBQUFBO0FBQUEsNkJBZVcsSUFmWCxFQWVpQjtBQUNsQixZQUFJLGdCQUFnQixJQUFwQixFQUEwQixPQUFPLElBQVA7QUFDMUIsY0FBTSxJQUFJLFNBQUosd0NBQW1ELElBQW5ELENBQU47QUFDRDtBQWxCRTs7QUFBQTtBQUFBO0FBQUEsQ0FBUCIsImZpbGUiOiJqcy9hcHAvbGluZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gVWNvbW1lbnQgZXhwb25lbnRpYXRpb24gb3BlcmF0b3IgbGF0ZXJcclxuLy8gTGluZXMgY2xhc3MsIHVzaW5nIHNsb3Bl4oCTaW50ZXJjZXB0IGZvcm0gZm9yIHNldHVwXHJcbmRlZmluZSgoKSA9PlxyXG4gIGNsYXNzIExpbmUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHsgeCA9IDAsIHkgPSAwLCBhbmdsZSA9IDAgfSkge1xyXG4gICAgICB0aGlzLmFuZ2xlID0gcGFyc2VGbG9hdChhbmdsZSkgJSAoTWF0aC5QSSAqIDIpO1xyXG4gICAgICB0aGlzLnggPSBwYXJzZUZsb2F0KHgpO1xyXG4gICAgICB0aGlzLnkgPSBwYXJzZUZsb2F0KHkpO1xyXG4gICAgICB0aGlzLmEgPSBNYXRoLnRhbih0aGlzLmFuZ2xlKTtcclxuICAgICAgdGhpcy5iID0gLTE7XHJcbiAgICAgIHRoaXMuYyA9IHRoaXMueSAtIHRoaXMuYSAqIHRoaXMueDtcclxuICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMpLmV2ZXJ5KHAgPT4gTnVtYmVyLmlzRmluaXRlKHRoaXNbcF0pKSkge1xyXG4gICAgICAgIE9iamVjdC5mcmVlemUodGhpcyk7XHJcbiAgICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoYFdyb25nIGxpbmUgc2V0dXA6ICR7eH0gLyAke3l9IC8gJHthbmdsZX1gKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaXNMaW5lKGxpbmUpIHtcclxuICAgICAgaWYgKGxpbmUgaW5zdGFuY2VvZiBMaW5lKSByZXR1cm4gbGluZTtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQXJndW1lbnQgaXMgbm90IGluc3RhbmNlIG9mIExpbmU6ICR7bGluZX1gKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXN0YW5jZUZyb20oeCA9IDAsIHkgPSAwKSB7XHJcbiAgICAgIGNvbnN0IHsgYSwgYiwgYyB9ID0gdGhpcztcclxuICAgICAgLy8gY29uc3QgZGlzdGFuY2UgPSAoYSAqIHggKyBiICogeSArIGMpIC8gTWF0aC5zcXJ0KGEgKiogMiArIGIgKiogMik7XHJcbiAgICAgIGNvbnN0IGRpc3RhbmNlID0gKGEgKiB4ICsgYiAqIHkgKyBjKSAvIE1hdGguc3FydChNYXRoLnBvdyhhLCAyKSArIE1hdGgucG93KGIsIDIpKTtcclxuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShkaXN0YW5jZSkpIHJldHVybiBkaXN0YW5jZTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBXcm9uZyBwb2ludCBjb29yZGluYXRlczogJHt4fSAvICR7eX1gKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcnNlY3RzKGxpbmUsIGFjY3VyYWN5ID0gOCkge1xyXG4gICAgICB0aGlzLmNvbnN0cnVjdG9yLmlzTGluZShsaW5lKTtcclxuICAgICAgY29uc3QgZGl2aWRlciA9IHRoaXMuYSAqIGxpbmUuYiAtIGxpbmUuYSAqIHRoaXMuYjtcclxuICAgICAgcmV0dXJuIGRpdmlkZXIgPT09IDAgPyBudWxsIDoge1xyXG4gICAgICAgIHg6IC0oKHRoaXMuYyAqIGxpbmUuYiAtIGxpbmUuYyAqIHRoaXMuYikgLyBkaXZpZGVyKS50b0ZpeGVkKGFjY3VyYWN5KSxcclxuICAgICAgICB5OiAtKCh0aGlzLmEgKiBsaW5lLmMgLSBsaW5lLmEgKiB0aGlzLmMpIC8gZGl2aWRlcikudG9GaXhlZChhY2N1cmFjeSksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QmlzZWN0b3IobGluZSkge1xyXG4gICAgICB0aGlzLmNvbnN0cnVjdG9yLmlzTGluZShsaW5lKTtcclxuICAgICAgcmV0dXJuIG5ldyBMaW5lKHtcclxuICAgICAgICB4OiAodGhpcy54ICsgbGluZS54KSAvIDIsXHJcbiAgICAgICAgeTogKHRoaXMueSArIGxpbmUueSkgLyAyLFxyXG4gICAgICAgIGFuZ2xlOiAodGhpcy5hbmdsZSArIGxpbmUuYW5nbGUpIC8gMixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
