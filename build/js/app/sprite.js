'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Picture graphic element constructor
define(['./utilities', './assets'], function (_ref, _ref2) {
  var props = _ref.props;
  var images = _ref2.images.pool;
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
//# sourceMappingURL=data:application/json;base64,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LENBQVo7QUFDQSxnQkFBUSxTQUFSLEdBQW9CLEtBQXBCO0FBQ0EsZ0JBQVEsUUFBUixDQUFpQixDQUFqQixFQUFvQixDQUFwQixFQUF1QixPQUFPLEtBQTlCLEVBQXFDLE9BQU8sTUFBNUM7QUFDQSxZQUFNLE9BQU8sUUFBUSxZQUFSLENBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLE9BQU8sS0FBbEMsRUFBeUMsT0FBTyxNQUFoRCxDQUFiOztBQUVBLGFBQUssSUFBSSxJQUFJLElBQUksSUFBSixDQUFTLE1BQXRCLEVBQThCLEdBQTlCLEdBQW9DO0FBQ2xDLGNBQUksSUFBSSxDQUFKLEtBQVUsQ0FBZCxFQUFpQixLQUFLLElBQUwsQ0FBVSxDQUFWLElBQWUsSUFBSSxJQUFKLENBQVMsQ0FBVCxDQUFmO0FBQ2xCOztBQUVELGdCQUFRLFlBQVIsQ0FBcUIsSUFBckIsRUFBMkIsQ0FBM0IsRUFBOEIsQ0FBOUI7QUFDQSxZQUFNLFdBQVcsSUFBSSxLQUFKLEVBQWpCO0FBQ0EsaUJBQVMsR0FBVCxHQUFlLE9BQU8sU0FBUCxDQUFpQixXQUFqQixDQUFmO0FBQ0EsYUFBSyxLQUFMLEdBQWEsUUFBYjtBQUNEO0FBdkQrQjs7QUFBQTtBQUFBO0FBQUEsQ0FBcEMiLCJmaWxlIjoianMvYXBwL3Nwcml0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFBpY3R1cmUgZ3JhcGhpYyBlbGVtZW50IGNvbnN0cnVjdG9yXHJcbmRlZmluZShbJy4vdXRpbGl0aWVzJywgJy4vYXNzZXRzJ10sICh7IHByb3BzIH0sIHsgaW1hZ2VzOiB7IHBvb2w6IGltYWdlcyB9IH0pID0+XHJcbiAgY2xhc3MgU3ByaXRlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihzZXR1cCkge1xyXG4gICAgICB0aGlzLmltYWdlID0gaW1hZ2VzW3NldHVwLmltZ0lEXTtcclxuICAgICAgY29uc3QgcmF0aW8gPSBNYXRoLm1heChzZXR1cC5jb250YWluZXIud2lkdGgsIHNldHVwLmNvbnRhaW5lci5oZWlnaHQpIC9cclxuICAgICAgICAgIE1hdGgubWF4KHRoaXMuaW1hZ2Uud2lkdGgsIHRoaXMuaW1hZ2UuaGVpZ2h0KSB8fCAxO1xyXG5cclxuICAgICAgdGhpcy5hbmdsZSA9IHBhcnNlRmxvYXQoc2V0dXAuYW5nbGUpIHx8IDA7XHJcbiAgICAgIHRoaXMuY2VudGVyID0gcHJvcHMuZnJvbVRvKHNldHVwLmNlbnRlciwgeyB4OiAwLCB5OiAwIH0pO1xyXG4gICAgICB0aGlzLnNjYWxlID0gcHJvcHMuZnJvbVRvKHNldHVwLnNjYWxlLCB7IHdpZHRoOiAxLCBoZWlnaHQ6IDEgfSk7XHJcblxyXG4gICAgICB0aGlzLmZyYW1lcyA9IHByb3BzLmZyb21UbyhzZXR1cC5mcmFtZXMsIHtcclxuICAgICAgICBpblJvdzogMSwgdG90YWw6IDEsIGRlbGF5OiAwLCBjdXJyZW50OiAtMSxcclxuICAgICAgICBuZXh0KCkge1xyXG4gICAgICAgICAgY29uc3QgaGFzTmV4dCA9IHRoaXMuY3VycmVudCA8IHRoaXMudG90YWwgLSAxO1xyXG4gICAgICAgICAgaWYgKGhhc05leHQpIHRoaXMuY3VycmVudCArPSAxO1xyXG4gICAgICAgICAgcmV0dXJuIGhhc05leHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLmZyYW1lcy53aWR0aCA9IHRoaXMuaW1hZ2Uud2lkdGggLyB0aGlzLmZyYW1lcy5pblJvdztcclxuICAgICAgdGhpcy5mcmFtZXMuaGVpZ2h0ID0gdGhpcy5pbWFnZS5oZWlnaHQgL1xyXG4gICAgICAgIE1hdGguY2VpbCh0aGlzLmZyYW1lcy50b3RhbCAvIHRoaXMuZnJhbWVzLmluUm93KTtcclxuICAgICAgdGhpcy53aWR0aCA9IHRoaXMuZnJhbWVzLndpZHRoICogcmF0aW87XHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5mcmFtZXMuaGVpZ2h0ICogcmF0aW87XHJcbiAgICAgIHRoaXMuZHggPSAtdGhpcy53aWR0aCAvIDI7XHJcbiAgICAgIHRoaXMuZHkgPSAtdGhpcy5oZWlnaHQgLyAyO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICB0aGlzLmNoYW5nZUNvbG9yKHNldHVwLmNvbG9yIHx8ICcjMDAwJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikgeyAvKiBDb250aW51ZSByZWdhcmRsZXNzIG9mIGVycm9yICovIH1cclxuICAgICAgT2JqZWN0LmZyZWV6ZSh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VDb2xvcihjb2xvcikge1xyXG4gICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICBjYW52YXMud2lkdGggPSB0aGlzLmltYWdlLndpZHRoO1xyXG4gICAgICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5pbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICBjb250ZXh0LmRyYXdJbWFnZSh0aGlzLmltYWdlLCAwLCAwKTtcclxuICAgICAgY29uc3QgaW1nID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcclxuICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICBjb25zdCBmaWxsID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgIGZvciAobGV0IGkgPSBpbWcuZGF0YS5sZW5ndGg7IGktLTspIHtcclxuICAgICAgICBpZiAoaSAlIDQgPT09IDMpIGZpbGwuZGF0YVtpXSA9IGltZy5kYXRhW2ldO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShmaWxsLCAwLCAwKTtcclxuICAgICAgY29uc3QgbmV3SW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgbmV3SW1hZ2Uuc3JjID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XHJcbiAgICAgIHRoaXMuaW1hZ2UgPSBuZXdJbWFnZTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
