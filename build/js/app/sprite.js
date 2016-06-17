'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Picture graphic element constructor
define(['./utilities', './assets'], function (_ref, _ref2) {
  var props = _ref.props;
  var images = _ref2.images;
  return function () {
    function Sprite(setup) {
      _classCallCheck(this, Sprite);

      this.image = images[setup.imgID];
      var ratio = Math.max(setup.container.width, setup.container.height) / Math.max(this.image.width, this.image.height) || 1;

      this.angle = parseFloat(setup.angle) || 0;
      this.center = props.fromTo(setup.center, { x: 0, y: 0 });
      this.scale = props.fromTo(setup.scale, { width: 1, height: 1 });

      this.frames = props.fromTo(setup.frames, {
        inRow: 1, total: 1, delay: 0, current: -1,
        next: function next() {
          var hasNext = this.current < this.total - 1;
          if (hasNext) this.current += 1;
          return hasNext;
        }
      });

      this.frames.width = this.image.width / this.frames.inRow;
      this.frames.height = this.image.height / Math.ceil(this.frames.total / this.frames.inRow);
      this.width = this.frames.width * ratio;
      this.height = this.frames.height * ratio;
      this.dx = -this.width / 2;
      this.dy = -this.height / 2;

      try {
        this.changeColor(setup.color || '#000');
      } catch (err) {/* Continue regardless of error */}
      Object.freeze(this);
    }

    _createClass(Sprite, [{
      key: 'changeColor',
      value: function changeColor(color) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = this.image.width;
        canvas.height = this.image.height;

        context.drawImage(this.image, 0, 0);
        var img = context.getImageData(0, 0, canvas.width, canvas.height);
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        var fill = context.getImageData(0, 0, canvas.width, canvas.height);

        for (var i = img.data.length; i--;) {
          if (i % 4 === 3) fill.data[i] = img.data[i];
        }

        context.putImageData(fill, 0, 0);
        var newImage = new Image();
        newImage.src = canvas.toDataURL('image/png');
        this.image = newImage;
      }
    }]);

    return Sprite;
  }();
});
//# sourceMappingURL=data:application/json;base64,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QVEsU0FBUixHQUFvQixLQUFwQjtBQUNBLGdCQUFRLFFBQVIsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsRUFBdUIsT0FBTyxLQUE5QixFQUFxQyxPQUFPLE1BQTVDO0FBQ0EsWUFBTSxPQUFPLFFBQVEsWUFBUixDQUFxQixDQUFyQixFQUF3QixDQUF4QixFQUEyQixPQUFPLEtBQWxDLEVBQXlDLE9BQU8sTUFBaEQsQ0FBYjs7QUFFQSxhQUFLLElBQUksSUFBSSxJQUFJLElBQUosQ0FBUyxNQUF0QixFQUE4QixHQUE5QixHQUFvQztBQUNsQyxjQUFJLElBQUksQ0FBSixLQUFVLENBQWQsRUFBaUIsS0FBSyxJQUFMLENBQVUsQ0FBVixJQUFlLElBQUksSUFBSixDQUFTLENBQVQsQ0FBZjtBQUNsQjs7QUFFRCxnQkFBUSxZQUFSLENBQXFCLElBQXJCLEVBQTJCLENBQTNCLEVBQThCLENBQTlCO0FBQ0EsWUFBTSxXQUFXLElBQUksS0FBSixFQUFqQjtBQUNBLGlCQUFTLEdBQVQsR0FBZSxPQUFPLFNBQVAsQ0FBaUIsV0FBakIsQ0FBZjtBQUNBLGFBQUssS0FBTCxHQUFhLFFBQWI7QUFDRDtBQXZEK0I7O0FBQUE7QUFBQTtBQUFBLENBQXBDIiwiZmlsZSI6ImpzL2FwcC9zcHJpdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQaWN0dXJlIGdyYXBoaWMgZWxlbWVudCBjb25zdHJ1Y3RvclxyXG5kZWZpbmUoWycuL3V0aWxpdGllcycsICcuL2Fzc2V0cyddLCAoeyBwcm9wcyB9LCB7IGltYWdlcyB9KSA9PlxyXG4gIGNsYXNzIFNwcml0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2V0dXApIHtcclxuICAgICAgdGhpcy5pbWFnZSA9IGltYWdlc1tzZXR1cC5pbWdJRF07XHJcbiAgICAgIGNvbnN0IHJhdGlvID0gTWF0aC5tYXgoc2V0dXAuY29udGFpbmVyLndpZHRoLCBzZXR1cC5jb250YWluZXIuaGVpZ2h0KSAvXHJcbiAgICAgICAgICBNYXRoLm1heCh0aGlzLmltYWdlLndpZHRoLCB0aGlzLmltYWdlLmhlaWdodCkgfHwgMTtcclxuXHJcbiAgICAgIHRoaXMuYW5nbGUgPSBwYXJzZUZsb2F0KHNldHVwLmFuZ2xlKSB8fCAwO1xyXG4gICAgICB0aGlzLmNlbnRlciA9IHByb3BzLmZyb21UbyhzZXR1cC5jZW50ZXIsIHsgeDogMCwgeTogMCB9KTtcclxuICAgICAgdGhpcy5zY2FsZSA9IHByb3BzLmZyb21UbyhzZXR1cC5zY2FsZSwgeyB3aWR0aDogMSwgaGVpZ2h0OiAxIH0pO1xyXG5cclxuICAgICAgdGhpcy5mcmFtZXMgPSBwcm9wcy5mcm9tVG8oc2V0dXAuZnJhbWVzLCB7XHJcbiAgICAgICAgaW5Sb3c6IDEsIHRvdGFsOiAxLCBkZWxheTogMCwgY3VycmVudDogLTEsXHJcbiAgICAgICAgbmV4dCgpIHtcclxuICAgICAgICAgIGNvbnN0IGhhc05leHQgPSB0aGlzLmN1cnJlbnQgPCB0aGlzLnRvdGFsIC0gMTtcclxuICAgICAgICAgIGlmIChoYXNOZXh0KSB0aGlzLmN1cnJlbnQgKz0gMTtcclxuICAgICAgICAgIHJldHVybiBoYXNOZXh0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5mcmFtZXMud2lkdGggPSB0aGlzLmltYWdlLndpZHRoIC8gdGhpcy5mcmFtZXMuaW5Sb3c7XHJcbiAgICAgIHRoaXMuZnJhbWVzLmhlaWdodCA9IHRoaXMuaW1hZ2UuaGVpZ2h0IC9cclxuICAgICAgICBNYXRoLmNlaWwodGhpcy5mcmFtZXMudG90YWwgLyB0aGlzLmZyYW1lcy5pblJvdyk7XHJcbiAgICAgIHRoaXMud2lkdGggPSB0aGlzLmZyYW1lcy53aWR0aCAqIHJhdGlvO1xyXG4gICAgICB0aGlzLmhlaWdodCA9IHRoaXMuZnJhbWVzLmhlaWdodCAqIHJhdGlvO1xyXG4gICAgICB0aGlzLmR4ID0gLXRoaXMud2lkdGggLyAyO1xyXG4gICAgICB0aGlzLmR5ID0gLXRoaXMuaGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5jaGFuZ2VDb2xvcihzZXR1cC5jb2xvciB8fCAnIzAwMCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHsgLyogQ29udGludWUgcmVnYXJkbGVzcyBvZiBlcnJvciAqLyB9XHJcbiAgICAgIE9iamVjdC5mcmVlemUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlQ29sb3IoY29sb3IpIHtcclxuICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgY2FudmFzLndpZHRoID0gdGhpcy5pbWFnZS53aWR0aDtcclxuICAgICAgY2FudmFzLmhlaWdodCA9IHRoaXMuaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGhpcy5pbWFnZSwgMCwgMCk7XHJcbiAgICAgIGNvbnN0IGltZyA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XHJcbiAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgICAgY29uc3QgZmlsbCA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgICBmb3IgKGxldCBpID0gaW1nLmRhdGEubGVuZ3RoOyBpLS07KSB7XHJcbiAgICAgICAgaWYgKGkgJSA0ID09PSAzKSBmaWxsLmRhdGFbaV0gPSBpbWcuZGF0YVtpXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29udGV4dC5wdXRJbWFnZURhdGEoZmlsbCwgMCwgMCk7XHJcbiAgICAgIGNvbnN0IG5ld0ltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICAgIG5ld0ltYWdlLnNyYyA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICB0aGlzLmltYWdlID0gbmV3SW1hZ2U7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
