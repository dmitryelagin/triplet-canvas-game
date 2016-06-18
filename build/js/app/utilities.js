'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// Support functions
define({

  props: {
    fromTo: function fromTo(src, def) {
      var obj = {};
      Object.keys(def).forEach(function (p) {
        obj[p] = _typeof(src[p]) === _typeof(def[p]) ? src[p] : def[p];
      });
      return obj;
    }
  },

  random: {
    get sign() {
      return Math.sign(Math.random() - 0.5) || 1;
    },

    error: function error(range) {
      return this.sign * Math.random() * (Math.abs(range) || 0);
    },
    item: function item(arr) {
      return Array.isArray(arr) ? arr[~ ~(Math.random() * arr.length)] : null;
    },
    makeRandomizer: function makeRandomizer(arg) {
      switch (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) {
        case 'undefined':
          return this.sign;
        case 'number':
          return this.error.bind(this, arg);
        default:
          return this.item.bind(this, arg);
      }
    }
  },

  worker: {
    fromFn: function fromFn(_ref) {
      var code = _ref.code;
      var handler = _ref.handler;
      var onload = _ref.onload;
      var href = _ref.href;
      var amdCfg = _ref.amdCfg;

      var isFn = function isFn(fn) {
        return typeof fn === 'function';
      };
      if (isFn(code)) {
        var _ret = function () {
          var url = URL.createObjectURL(new Blob([code.toString().replace(/.*?{\s*/, '').replace(/\s*}.*$/, '')], { type: 'javascript/worker' }));
          var wrkr = new Worker(url);
          URL.revokeObjectURL(url);
          wrkr.onmessage = function (e) {
            if (e.data.init) {
              if (isFn(handler)) wrkr.onmessage = handler;
              if (isFn(onload)) onload(wrkr, e.data.args);
            } else {
              throw new Error('Worker can not be initialized: ' + e.data.error);
            }
          };
          wrkr.postMessage({ href: href, amdCfg: amdCfg });
          return {
            v: wrkr
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }
      return null;
    }
  },

  html: {
    makeCanvas: function makeCanvas(id, width, height, parent) {
      var canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.width = width;
      canvas.height = height;
      canvas.innerText = 'Your browser does not support HTML5 Canvas.';
      parent.appendChild(canvas);
      return canvas;
    },
    clickCoords: function clickCoords(event) {
      var _event$target$getBoun = event.target.getBoundingClientRect();

      var left = _event$target$getBoun.left;
      var top = _event$target$getBoun.top;

      return {
        x: event.clientX - left,
        y: event.clientY - top
      };
    }
  }

});
//# sourceMappingURL=data:application/json;base64,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QUFDQTtBQUFBLGVBQU87QUFBUDtBQWZjOztBQUFBO0FBZ0JmO0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7QUFyQkssR0FsQ0g7O0FBMERMLFFBQU07QUFDSixjQURJLHNCQUNPLEVBRFAsRUFDVyxLQURYLEVBQ2tCLE1BRGxCLEVBQzBCLE1BRDFCLEVBQ2tDO0FBQ3BDLFVBQU0sU0FBUyxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLGFBQU8sRUFBUCxHQUFZLEVBQVo7QUFDQSxhQUFPLEtBQVAsR0FBZSxLQUFmO0FBQ0EsYUFBTyxNQUFQLEdBQWdCLE1BQWhCO0FBQ0EsYUFBTyxTQUFQLEdBQW1CLDZDQUFuQjtBQUNBLGFBQU8sV0FBUCxDQUFtQixNQUFuQjtBQUNBLGFBQU8sTUFBUDtBQUNELEtBVEc7QUFXSixlQVhJLHVCQVdRLEtBWFIsRUFXZTtBQUFBLGtDQUNLLE1BQU0sTUFBTixDQUFhLHFCQUFiLEVBREw7O0FBQUEsVUFDVCxJQURTLHlCQUNULElBRFM7QUFBQSxVQUNILEdBREcseUJBQ0gsR0FERzs7QUFFakIsYUFBTztBQUNMLFdBQUcsTUFBTSxPQUFOLEdBQWdCLElBRGQ7QUFFTCxXQUFHLE1BQU0sT0FBTixHQUFnQjtBQUZkLE9BQVA7QUFJRDtBQWpCRzs7QUExREQsQ0FBUCIsImZpbGUiOiJqcy9hcHAvdXRpbGl0aWVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU3VwcG9ydCBmdW5jdGlvbnNcclxuZGVmaW5lKHtcclxuXHJcbiAgcHJvcHM6IHtcclxuICAgIGZyb21UbyhzcmMsIGRlZikge1xyXG4gICAgICBjb25zdCBvYmogPSB7fTtcclxuICAgICAgT2JqZWN0LmtleXMoZGVmKS5mb3JFYWNoKHAgPT4ge1xyXG4gICAgICAgIG9ialtwXSA9IHR5cGVvZiBzcmNbcF0gPT09IHR5cGVvZiBkZWZbcF0gPyBzcmNbcF0gOiBkZWZbcF07XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICByYW5kb206IHtcclxuICAgIGdldCBzaWduKCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5zaWduKE1hdGgucmFuZG9tKCkgLSAwLjUpIHx8IDE7XHJcbiAgICB9LFxyXG5cclxuICAgIGVycm9yKHJhbmdlKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNpZ24gKiBNYXRoLnJhbmRvbSgpICogKE1hdGguYWJzKHJhbmdlKSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXRlbShhcnIpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyKSA/IGFyclt+fihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVJhbmRvbWl6ZXIoYXJnKSB7XHJcbiAgICAgIHN3aXRjaCAodHlwZW9mIGFyZykge1xyXG4gICAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6IHJldHVybiB0aGlzLnNpZ247XHJcbiAgICAgICAgY2FzZSAnbnVtYmVyJzogcmV0dXJuIHRoaXMuZXJyb3IuYmluZCh0aGlzLCBhcmcpO1xyXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiB0aGlzLml0ZW0uYmluZCh0aGlzLCBhcmcpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIHdvcmtlcjoge1xyXG4gICAgZnJvbUZuKHsgY29kZSwgaGFuZGxlciwgb25sb2FkLCBocmVmLCBhbWRDZmcgfSkge1xyXG4gICAgICBjb25zdCBpc0ZuID0gZm4gPT4gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nO1xyXG4gICAgICBpZiAoaXNGbihjb2RlKSkge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoXHJcbiAgICAgICAgICAgIFtjb2RlLnRvU3RyaW5nKCkucmVwbGFjZSgvLio/e1xccyovLCAnJykucmVwbGFjZSgvXFxzKn0uKiQvLCAnJyldLFxyXG4gICAgICAgICAgICB7IHR5cGU6ICdqYXZhc2NyaXB0L3dvcmtlcicgfSkpO1xyXG4gICAgICAgIGNvbnN0IHdya3IgPSBuZXcgV29ya2VyKHVybCk7XHJcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICAgIHdya3Iub25tZXNzYWdlID0gZSA9PiB7XHJcbiAgICAgICAgICBpZiAoZS5kYXRhLmluaXQpIHtcclxuICAgICAgICAgICAgaWYgKGlzRm4oaGFuZGxlcikpIHdya3Iub25tZXNzYWdlID0gaGFuZGxlcjtcclxuICAgICAgICAgICAgaWYgKGlzRm4ob25sb2FkKSkgb25sb2FkKHdya3IsIGUuZGF0YS5hcmdzKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgV29ya2VyIGNhbiBub3QgYmUgaW5pdGlhbGl6ZWQ6ICR7ZS5kYXRhLmVycm9yfWApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgd3Jrci5wb3N0TWVzc2FnZSh7IGhyZWYsIGFtZENmZyB9KTtcclxuICAgICAgICByZXR1cm4gd3JrcjtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgaHRtbDoge1xyXG4gICAgbWFrZUNhbnZhcyhpZCwgd2lkdGgsIGhlaWdodCwgcGFyZW50KSB7XHJcbiAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICBjYW52YXMuaWQgPSBpZDtcclxuICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgIGNhbnZhcy5pbm5lclRleHQgPSAnWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgSFRNTDUgQ2FudmFzLic7XHJcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChjYW52YXMpO1xyXG4gICAgICByZXR1cm4gY2FudmFzO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGlja0Nvb3JkcyhldmVudCkge1xyXG4gICAgICBjb25zdCB7IGxlZnQsIHRvcCB9ID0gZXZlbnQudGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IGV2ZW50LmNsaWVudFggLSBsZWZ0LFxyXG4gICAgICAgIHk6IGV2ZW50LmNsaWVudFkgLSB0b3AsXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG59KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
