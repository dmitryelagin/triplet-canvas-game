// Support functions
define({

  props: {
    fromTo(src, def) {
      const obj = {};
      Object.keys(def).forEach(p => {
        obj[p] = typeof src[p] === typeof def[p] ? src[p] : def[p];
      });
      return obj;
    },
  },

  random: {
    get sign() {
      return Math.sign(Math.random() - 0.5) || 1;
    },

    error(range) {
      return this.sign * Math.random() * (Math.abs(range) || 0);
    },

    item(arr) {
      return Array.isArray(arr) ? arr[~~(Math.random() * arr.length)] : null;
    },

    makeRandomizer(arg) {
      switch (typeof arg) {
        case 'undefined': return this.sign;
        case 'number': return this.error.bind(this, arg);
        default: return this.item.bind(this, arg);
      }
    },
  },

  worker: {
    fromFn({ code, handler, onload, importFrom: href = '', args }) {
      const isFn = fn => typeof fn === 'function';
      const url = URL.createObjectURL(new Blob([code]));
      const wrkr = new Worker(url);
      URL.revokeObjectURL(url);
      wrkr.onmessage = e => {
        if (e.data.init) {
          if (isFn(handler)) wrkr.onmessage = handler;
          if (isFn(onload)) onload(wrkr, e.data.args);
        } else {
          throw new Error(`Worker can not be initialized: ${e.data.error}`);
        }
      };
      wrkr.postMessage({ href, args });
      return wrkr;
    },
  },

  html: {
    makeCanvas(id, width, height, parent) {
      const canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.width = width;
      canvas.height = height;
      canvas.innerText = 'Your browser does not support HTML5 Canvas.';
      parent.appendChild(canvas);
      return canvas;
    },

    clickCoords(event) {
      const { left, top } = event.target.getBoundingClientRect();
      return {
        x: event.clientX - left,
        y: event.clientY - top,
      };
    },
  },

});
