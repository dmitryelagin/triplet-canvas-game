"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
        if (line instanceof this.constructor) return line;
        throw new TypeError("Argument is not instance of Line: " + line);
      }
    }]);

    return Line;
  }();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC9saW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFDQSxPQUFPO0FBQUE7QUFHSCx3QkFBeUM7QUFBQTs7QUFBQSx3QkFBM0IsQ0FBMkI7QUFBQSxVQUEzQixDQUEyQiwwQkFBdkIsQ0FBdUI7QUFBQSx3QkFBcEIsQ0FBb0I7QUFBQSxVQUFwQixDQUFvQiwwQkFBaEIsQ0FBZ0I7QUFBQSw0QkFBYixLQUFhO0FBQUEsVUFBYixLQUFhLDhCQUFMLENBQUs7O0FBQUE7O0FBQ3ZDLFdBQUssS0FBTCxHQUFhLFdBQVcsS0FBWCxLQUFxQixLQUFLLEVBQUwsR0FBVSxDQUEvQixDQUFiO0FBQ0EsV0FBSyxDQUFMLEdBQVMsV0FBVyxDQUFYLENBQVQ7QUFDQSxXQUFLLENBQUwsR0FBUyxXQUFXLENBQVgsQ0FBVDtBQUNBLFdBQUssQ0FBTCxHQUFTLEtBQUssR0FBTCxDQUFTLEtBQUssS0FBZCxDQUFUO0FBQ0EsV0FBSyxDQUFMLEdBQVMsQ0FBQyxDQUFWO0FBQ0EsV0FBSyxDQUFMLEdBQVMsS0FBSyxDQUFMLEdBQVMsS0FBSyxDQUFMLEdBQVMsS0FBSyxDQUFoQztBQUNBLFVBQUksT0FBTyxJQUFQLENBQVksSUFBWixFQUFrQixLQUFsQixDQUF3QjtBQUFBLGVBQUssT0FBTyxRQUFQLENBQWdCLE1BQUssQ0FBTCxDQUFoQixDQUFMO0FBQUEsT0FBeEIsQ0FBSixFQUE0RDtBQUMxRCxlQUFPLE1BQVAsQ0FBYyxJQUFkO0FBQ0QsT0FGRCxNQUVPLE1BQU0sSUFBSSxLQUFKLHdCQUErQixDQUEvQixXQUFzQyxDQUF0QyxXQUE2QyxLQUE3QyxDQUFOO0FBQ1I7O0FBYkU7QUFBQTtBQUFBLHFDQW9Cd0I7QUFBQSxZQUFkLENBQWMseURBQVYsQ0FBVTtBQUFBLFlBQVAsQ0FBTyx5REFBSCxDQUFHO0FBQUEsWUFDakIsQ0FEaUIsR0FDTCxJQURLLENBQ2pCLENBRGlCO0FBQUEsWUFDZCxDQURjLEdBQ0wsSUFESyxDQUNkLENBRGM7QUFBQSxZQUNYLENBRFcsR0FDTCxJQURLLENBQ1gsQ0FEVzs7O0FBR3pCLFlBQU0sV0FBVyxDQUFDLElBQUksQ0FBSixHQUFRLElBQUksQ0FBWixHQUFnQixDQUFqQixJQUFzQixLQUFLLElBQUwsQ0FBVSxLQUFLLEdBQUwsQ0FBUyxDQUFULEVBQVksQ0FBWixJQUFpQixLQUFLLEdBQUwsQ0FBUyxDQUFULEVBQVksQ0FBWixDQUEzQixDQUF2QztBQUNBLFlBQUksT0FBTyxRQUFQLENBQWdCLFFBQWhCLENBQUosRUFBK0IsT0FBTyxRQUFQO0FBQy9CLGNBQU0sSUFBSSxLQUFKLCtCQUFzQyxDQUF0QyxXQUE2QyxDQUE3QyxDQUFOO0FBQ0Q7QUExQkU7QUFBQTtBQUFBLGlDQTRCUSxJQTVCUixFQTRCNEI7QUFBQSxZQUFkLFFBQWMseURBQUgsQ0FBRzs7QUFDN0IsYUFBSyxXQUFMLENBQWlCLE1BQWpCLENBQXdCLElBQXhCO0FBQ0EsWUFBTSxVQUFVLEtBQUssQ0FBTCxHQUFTLEtBQUssQ0FBZCxHQUFrQixLQUFLLENBQUwsR0FBUyxLQUFLLENBQWhEO0FBQ0EsZUFBTyxZQUFZLENBQVosR0FBZ0IsSUFBaEIsR0FBdUI7QUFDNUIsYUFBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUwsR0FBUyxLQUFLLENBQWQsR0FBa0IsS0FBSyxDQUFMLEdBQVMsS0FBSyxDQUFqQyxJQUFzQyxPQUF2QyxFQUFnRCxPQUFoRCxDQUF3RCxRQUF4RCxDQUR3QjtBQUU1QixhQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBTCxHQUFTLEtBQUssQ0FBZCxHQUFrQixLQUFLLENBQUwsR0FBUyxLQUFLLENBQWpDLElBQXNDLE9BQXZDLEVBQWdELE9BQWhELENBQXdELFFBQXhEO0FBRndCLFNBQTlCO0FBSUQ7QUFuQ0U7QUFBQTtBQUFBLGtDQXFDUyxJQXJDVCxFQXFDZTtBQUNoQixhQUFLLFdBQUwsQ0FBaUIsTUFBakIsQ0FBd0IsSUFBeEI7QUFDQSxlQUFPLElBQUksSUFBSixDQUFTO0FBQ2QsYUFBRyxDQUFDLEtBQUssQ0FBTCxHQUFTLEtBQUssQ0FBZixJQUFvQixDQURUO0FBRWQsYUFBRyxDQUFDLEtBQUssQ0FBTCxHQUFTLEtBQUssQ0FBZixJQUFvQixDQUZUO0FBR2QsaUJBQU8sQ0FBQyxLQUFLLEtBQUwsR0FBYSxLQUFLLEtBQW5CLElBQTRCO0FBSHJCLFNBQVQsQ0FBUDtBQUtEO0FBNUNFO0FBQUE7QUFBQSw2QkFlVyxJQWZYLEVBZWlCO0FBQ2xCLFlBQUksZ0JBQWdCLEtBQUssV0FBekIsRUFBc0MsT0FBTyxJQUFQO0FBQ3RDLGNBQU0sSUFBSSxTQUFKLHdDQUFtRCxJQUFuRCxDQUFOO0FBQ0Q7QUFsQkU7O0FBQUE7QUFBQTtBQUFBLENBQVAiLCJmaWxlIjoianMvYXBwL2xpbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaW5lcyBjbGFzcywgdXNpbmcgc2xvcGXigJNpbnRlcmNlcHQgZm9ybSBmb3Igc2V0dXBcclxuZGVmaW5lKCgpID0+XHJcbiAgY2xhc3MgTGluZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoeyB4ID0gMCwgeSA9IDAsIGFuZ2xlID0gMCB9KSB7XHJcbiAgICAgIHRoaXMuYW5nbGUgPSBwYXJzZUZsb2F0KGFuZ2xlKSAlIChNYXRoLlBJICogMik7XHJcbiAgICAgIHRoaXMueCA9IHBhcnNlRmxvYXQoeCk7XHJcbiAgICAgIHRoaXMueSA9IHBhcnNlRmxvYXQoeSk7XHJcbiAgICAgIHRoaXMuYSA9IE1hdGgudGFuKHRoaXMuYW5nbGUpO1xyXG4gICAgICB0aGlzLmIgPSAtMTtcclxuICAgICAgdGhpcy5jID0gdGhpcy55IC0gdGhpcy5hICogdGhpcy54O1xyXG4gICAgICBpZiAoT2JqZWN0LmtleXModGhpcykuZXZlcnkocCA9PiBOdW1iZXIuaXNGaW5pdGUodGhpc1twXSkpKSB7XHJcbiAgICAgICAgT2JqZWN0LmZyZWV6ZSh0aGlzKTtcclxuICAgICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcihgV3JvbmcgbGluZSBzZXR1cDogJHt4fSAvICR7eX0gLyAke2FuZ2xlfWApO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBpc0xpbmUobGluZSkge1xyXG4gICAgICBpZiAobGluZSBpbnN0YW5jZW9mIHRoaXMuY29uc3RydWN0b3IpIHJldHVybiBsaW5lO1xyXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBBcmd1bWVudCBpcyBub3QgaW5zdGFuY2Ugb2YgTGluZTogJHtsaW5lfWApO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3RhbmNlRnJvbSh4ID0gMCwgeSA9IDApIHtcclxuICAgICAgY29uc3QgeyBhLCBiLCBjIH0gPSB0aGlzO1xyXG4gICAgICAvLyBjb25zdCBkaXN0YW5jZSA9IChhICogeCArIGIgKiB5ICsgYykgLyBNYXRoLnNxcnQoYSAqKiAyICsgYiAqKiAyKTtcclxuICAgICAgY29uc3QgZGlzdGFuY2UgPSAoYSAqIHggKyBiICogeSArIGMpIC8gTWF0aC5zcXJ0KE1hdGgucG93KGEsIDIpICsgTWF0aC5wb3coYiwgMikpO1xyXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGRpc3RhbmNlKSkgcmV0dXJuIGRpc3RhbmNlO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFdyb25nIHBvaW50IGNvb3JkaW5hdGVzOiAke3h9IC8gJHt5fWApO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyc2VjdHMobGluZSwgYWNjdXJhY3kgPSA4KSB7XHJcbiAgICAgIHRoaXMuY29uc3RydWN0b3IuaXNMaW5lKGxpbmUpO1xyXG4gICAgICBjb25zdCBkaXZpZGVyID0gdGhpcy5hICogbGluZS5iIC0gbGluZS5hICogdGhpcy5iO1xyXG4gICAgICByZXR1cm4gZGl2aWRlciA9PT0gMCA/IG51bGwgOiB7XHJcbiAgICAgICAgeDogLSgodGhpcy5jICogbGluZS5iIC0gbGluZS5jICogdGhpcy5iKSAvIGRpdmlkZXIpLnRvRml4ZWQoYWNjdXJhY3kpLFxyXG4gICAgICAgIHk6IC0oKHRoaXMuYSAqIGxpbmUuYyAtIGxpbmUuYSAqIHRoaXMuYykgLyBkaXZpZGVyKS50b0ZpeGVkKGFjY3VyYWN5KSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRCaXNlY3RvcihsaW5lKSB7XHJcbiAgICAgIHRoaXMuY29uc3RydWN0b3IuaXNMaW5lKGxpbmUpO1xyXG4gICAgICByZXR1cm4gbmV3IExpbmUoe1xyXG4gICAgICAgIHg6ICh0aGlzLnggKyBsaW5lLngpIC8gMixcclxuICAgICAgICB5OiAodGhpcy55ICsgbGluZS55KSAvIDIsXHJcbiAgICAgICAgYW5nbGU6ICh0aGlzLmFuZ2xlICsgbGluZS5hbmdsZSkgLyAyLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
