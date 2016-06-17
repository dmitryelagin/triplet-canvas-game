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
      var _ref$importFrom = _ref.importFrom;
      var href = _ref$importFrom === undefined ? '' : _ref$importFrom;
      var args = _ref.args;

      var isFn = function isFn(fn) {
        return typeof fn === 'function';
      };
      var url = URL.createObjectURL(new Blob([code]));
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
      wrkr.postMessage({ href: href, args: args });
      return wrkr;
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
//# sourceMappingURL=data:application/json;base64,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dUIsUUFBdkIsQ0FBZjtBQUNBLGFBQU8sRUFBUCxHQUFZLEVBQVo7QUFDQSxhQUFPLEtBQVAsR0FBZSxLQUFmO0FBQ0EsYUFBTyxNQUFQLEdBQWdCLE1BQWhCO0FBQ0EsYUFBTyxTQUFQLEdBQW1CLDZDQUFuQjtBQUNBLGFBQU8sV0FBUCxDQUFtQixNQUFuQjtBQUNBLGFBQU8sTUFBUDtBQUNELEtBVEc7QUFXSixlQVhJLHVCQVdRLEtBWFIsRUFXZTtBQUFBLGtDQUNLLE1BQU0sTUFBTixDQUFhLHFCQUFiLEVBREw7O0FBQUEsVUFDVCxJQURTLHlCQUNULElBRFM7QUFBQSxVQUNILEdBREcseUJBQ0gsR0FERzs7QUFFakIsYUFBTztBQUNMLFdBQUcsTUFBTSxPQUFOLEdBQWdCLElBRGQ7QUFFTCxXQUFHLE1BQU0sT0FBTixHQUFnQjtBQUZkLE9BQVA7QUFJRDtBQWpCRzs7QUFyREQsQ0FBUCIsImZpbGUiOiJqcy9hcHAvdXRpbGl0aWVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU3VwcG9ydCBmdW5jdGlvbnNcclxuZGVmaW5lKHtcclxuXHJcbiAgcHJvcHM6IHtcclxuICAgIGZyb21UbyhzcmMsIGRlZikge1xyXG4gICAgICBjb25zdCBvYmogPSB7fTtcclxuICAgICAgT2JqZWN0LmtleXMoZGVmKS5mb3JFYWNoKHAgPT4ge1xyXG4gICAgICAgIG9ialtwXSA9IHR5cGVvZiBzcmNbcF0gPT09IHR5cGVvZiBkZWZbcF0gPyBzcmNbcF0gOiBkZWZbcF07XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICByYW5kb206IHtcclxuICAgIGdldCBzaWduKCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5zaWduKE1hdGgucmFuZG9tKCkgLSAwLjUpIHx8IDE7XHJcbiAgICB9LFxyXG5cclxuICAgIGVycm9yKHJhbmdlKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNpZ24gKiBNYXRoLnJhbmRvbSgpICogKE1hdGguYWJzKHJhbmdlKSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXRlbShhcnIpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyKSA/IGFyclt+fihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVJhbmRvbWl6ZXIoYXJnKSB7XHJcbiAgICAgIHN3aXRjaCAodHlwZW9mIGFyZykge1xyXG4gICAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6IHJldHVybiB0aGlzLnNpZ247XHJcbiAgICAgICAgY2FzZSAnbnVtYmVyJzogcmV0dXJuIHRoaXMuZXJyb3IuYmluZCh0aGlzLCBhcmcpO1xyXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiB0aGlzLml0ZW0uYmluZCh0aGlzLCBhcmcpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIHdvcmtlcjoge1xyXG4gICAgZnJvbUZuKHsgY29kZSwgaGFuZGxlciwgb25sb2FkLCBpbXBvcnRGcm9tOiBocmVmID0gJycsIGFyZ3MgfSkge1xyXG4gICAgICBjb25zdCBpc0ZuID0gZm4gPT4gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nO1xyXG4gICAgICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtjb2RlXSkpO1xyXG4gICAgICBjb25zdCB3cmtyID0gbmV3IFdvcmtlcih1cmwpO1xyXG4gICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICAgIHdya3Iub25tZXNzYWdlID0gZSA9PiB7XHJcbiAgICAgICAgaWYgKGUuZGF0YS5pbml0KSB7XHJcbiAgICAgICAgICBpZiAoaXNGbihoYW5kbGVyKSkgd3Jrci5vbm1lc3NhZ2UgPSBoYW5kbGVyO1xyXG4gICAgICAgICAgaWYgKGlzRm4ob25sb2FkKSkgb25sb2FkKHdya3IsIGUuZGF0YS5hcmdzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBXb3JrZXIgY2FuIG5vdCBiZSBpbml0aWFsaXplZDogJHtlLmRhdGEuZXJyb3J9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICB3cmtyLnBvc3RNZXNzYWdlKHsgaHJlZiwgYXJncyB9KTtcclxuICAgICAgcmV0dXJuIHdya3I7XHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIGh0bWw6IHtcclxuICAgIG1ha2VDYW52YXMoaWQsIHdpZHRoLCBoZWlnaHQsIHBhcmVudCkge1xyXG4gICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgY2FudmFzLmlkID0gaWQ7XHJcbiAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICBjYW52YXMuaW5uZXJUZXh0ID0gJ1lvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IEhUTUw1IENhbnZhcy4nO1xyXG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2FudmFzKTtcclxuICAgICAgcmV0dXJuIGNhbnZhcztcclxuICAgIH0sXHJcblxyXG4gICAgY2xpY2tDb29yZHMoZXZlbnQpIHtcclxuICAgICAgY29uc3QgeyBsZWZ0LCB0b3AgfSA9IGV2ZW50LnRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB4OiBldmVudC5jbGllbnRYIC0gbGVmdCxcclxuICAgICAgICB5OiBldmVudC5jbGllbnRZIC0gdG9wLFxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICB9LFxyXG5cclxufSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
