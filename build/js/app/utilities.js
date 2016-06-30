'use strict';

// TODO Maybe add function to check ability of modifying image via canvas
// Support functions
define({

  random: {
    get sign() {
      return Math.sign(Math.random() - 0.5) || 1;
    },

    error: function error(range) {
      return this.sign * Math.random() * (Math.abs(range) || 0);
    },
    item: function item(arr) {
      return Array.isArray(arr) ? arr[~ ~(Math.random() * arr.length)] : null;
    }
  },

  worker: {
    fromFn: function fromFn(_ref) {
      var code = _ref.code;
      var handler = _ref.handler;
      var href = _ref.href;
      var args = _ref.args;

      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(new Blob([code.toString().replace(/^.*?{\s*|\s*}.*$/g, '')]));
        var wrkr = new Worker(url);
        URL.revokeObjectURL(url);
        wrkr.onmessage = function (e) {
          if (e.data.init && typeof handler === 'function') {
            wrkr.onmessage = handler;
            resolve(wrkr);
          } else {
            reject(e.data.errorMessage || 'Handler must be a function.');
          }
        };
        wrkr.postMessage({ href: href, args: args });
      });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC91dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUVBLE9BQU87O0FBRUwsVUFBUTtBQUNOLFFBQUksSUFBSixHQUFXO0FBQ1QsYUFBTyxLQUFLLElBQUwsQ0FBVSxLQUFLLE1BQUwsS0FBZ0IsR0FBMUIsS0FBa0MsQ0FBekM7QUFDRCxLQUhLOztBQUtOLFNBTE0saUJBS0EsS0FMQSxFQUtPO0FBQ1gsYUFBTyxLQUFLLElBQUwsR0FBWSxLQUFLLE1BQUwsRUFBWixJQUE2QixLQUFLLEdBQUwsQ0FBUyxLQUFULEtBQW1CLENBQWhELENBQVA7QUFDRCxLQVBLO0FBU04sUUFUTSxnQkFTRCxHQVRDLEVBU0k7QUFDUixhQUFPLE1BQU0sT0FBTixDQUFjLEdBQWQsSUFBcUIsSUFBSSxFQUFDLEVBQUUsS0FBSyxNQUFMLEtBQWdCLElBQUksTUFBdEIsQ0FBTCxDQUFyQixHQUEyRCxJQUFsRTtBQUNEO0FBWEssR0FGSDs7QUFnQkwsVUFBUTtBQUNOLFVBRE0sd0JBQ2dDO0FBQUEsVUFBN0IsSUFBNkIsUUFBN0IsSUFBNkI7QUFBQSxVQUF2QixPQUF1QixRQUF2QixPQUF1QjtBQUFBLFVBQWQsSUFBYyxRQUFkLElBQWM7QUFBQSxVQUFSLElBQVEsUUFBUixJQUFROztBQUNwQyxhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBTSxNQUFNLElBQUksZUFBSixDQUNSLElBQUksSUFBSixDQUFTLENBQUMsS0FBSyxRQUFMLEdBQWdCLE9BQWhCLENBQXdCLG1CQUF4QixFQUE2QyxFQUE3QyxDQUFELENBQVQsQ0FEUSxDQUFaO0FBRUEsWUFBTSxPQUFPLElBQUksTUFBSixDQUFXLEdBQVgsQ0FBYjtBQUNBLFlBQUksZUFBSixDQUFvQixHQUFwQjtBQUNBLGFBQUssU0FBTCxHQUFpQixhQUFLO0FBQ3BCLGNBQUksRUFBRSxJQUFGLENBQU8sSUFBUCxJQUFlLE9BQU8sT0FBUCxLQUFtQixVQUF0QyxFQUFrRDtBQUNoRCxpQkFBSyxTQUFMLEdBQWlCLE9BQWpCO0FBQ0Esb0JBQVEsSUFBUjtBQUNELFdBSEQsTUFHTztBQUNMLG1CQUFPLEVBQUUsSUFBRixDQUFPLFlBQVAsSUFBdUIsNkJBQTlCO0FBQ0Q7QUFDRixTQVBEO0FBUUEsYUFBSyxXQUFMLENBQWlCLEVBQUUsVUFBRixFQUFRLFVBQVIsRUFBakI7QUFDRCxPQWRNLENBQVA7QUFlRDtBQWpCSyxHQWhCSDs7QUFvQ0wsUUFBTTtBQUNKLGNBREksc0JBQ08sRUFEUCxFQUNXLEtBRFgsRUFDa0IsTUFEbEIsRUFDMEIsTUFEMUIsRUFDa0M7QUFDcEMsVUFBTSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFmO0FBQ0EsYUFBTyxFQUFQLEdBQVksRUFBWjtBQUNBLGFBQU8sS0FBUCxHQUFlLEtBQWY7QUFDQSxhQUFPLE1BQVAsR0FBZ0IsTUFBaEI7QUFDQSxhQUFPLFNBQVAsR0FBbUIsNkNBQW5CO0FBQ0EsYUFBTyxXQUFQLENBQW1CLE1BQW5CO0FBQ0EsYUFBTyxNQUFQO0FBQ0QsS0FURztBQVdKLGVBWEksdUJBV1EsS0FYUixFQVdlO0FBQUEsa0NBQ0ssTUFBTSxNQUFOLENBQWEscUJBQWIsRUFETDs7QUFBQSxVQUNULElBRFMseUJBQ1QsSUFEUztBQUFBLFVBQ0gsR0FERyx5QkFDSCxHQURHOztBQUVqQixhQUFPO0FBQ0wsV0FBRyxNQUFNLE9BQU4sR0FBZ0IsSUFEZDtBQUVMLFdBQUcsTUFBTSxPQUFOLEdBQWdCO0FBRmQsT0FBUDtBQUlEO0FBakJHOztBQXBDRCxDQUFQIiwiZmlsZSI6ImpzL2FwcC91dGlsaXRpZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIE1heWJlIGFkZCBmdW5jdGlvbiB0byBjaGVjayBhYmlsaXR5IG9mIG1vZGlmeWluZyBpbWFnZSB2aWEgY2FudmFzXHJcbi8vIFN1cHBvcnQgZnVuY3Rpb25zXHJcbmRlZmluZSh7XHJcblxyXG4gIHJhbmRvbToge1xyXG4gICAgZ2V0IHNpZ24oKSB7XHJcbiAgICAgIHJldHVybiBNYXRoLnNpZ24oTWF0aC5yYW5kb20oKSAtIDAuNSkgfHwgMTtcclxuICAgIH0sXHJcblxyXG4gICAgZXJyb3IocmFuZ2UpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2lnbiAqIE1hdGgucmFuZG9tKCkgKiAoTWF0aC5hYnMocmFuZ2UpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpdGVtKGFycikge1xyXG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhcnIpID8gYXJyW35+KE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV0gOiBudWxsO1xyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICB3b3JrZXI6IHtcclxuICAgIGZyb21Gbih7IGNvZGUsIGhhbmRsZXIsIGhyZWYsIGFyZ3MgfSkge1xyXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoXHJcbiAgICAgICAgICAgIG5ldyBCbG9iKFtjb2RlLnRvU3RyaW5nKCkucmVwbGFjZSgvXi4qP3tcXHMqfFxccyp9LiokL2csICcnKV0pKTtcclxuICAgICAgICBjb25zdCB3cmtyID0gbmV3IFdvcmtlcih1cmwpO1xyXG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgICAgICB3cmtyLm9ubWVzc2FnZSA9IGUgPT4ge1xyXG4gICAgICAgICAgaWYgKGUuZGF0YS5pbml0ICYmIHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHdya3Iub25tZXNzYWdlID0gaGFuZGxlcjtcclxuICAgICAgICAgICAgcmVzb2x2ZSh3cmtyKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlamVjdChlLmRhdGEuZXJyb3JNZXNzYWdlIHx8ICdIYW5kbGVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHdya3IucG9zdE1lc3NhZ2UoeyBocmVmLCBhcmdzIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgaHRtbDoge1xyXG4gICAgbWFrZUNhbnZhcyhpZCwgd2lkdGgsIGhlaWdodCwgcGFyZW50KSB7XHJcbiAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICBjYW52YXMuaWQgPSBpZDtcclxuICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgIGNhbnZhcy5pbm5lclRleHQgPSAnWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgSFRNTDUgQ2FudmFzLic7XHJcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChjYW52YXMpO1xyXG4gICAgICByZXR1cm4gY2FudmFzO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGlja0Nvb3JkcyhldmVudCkge1xyXG4gICAgICBjb25zdCB7IGxlZnQsIHRvcCB9ID0gZXZlbnQudGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IGV2ZW50LmNsaWVudFggLSBsZWZ0LFxyXG4gICAgICAgIHk6IGV2ZW50LmNsaWVudFkgLSB0b3AsXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG59KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
