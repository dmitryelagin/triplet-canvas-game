// TODO Maybe add function to check ability of modifying image via canvas
// Support functions
define({

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
  },

  worker: {
    fromFn({ code, handler, href, args }) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(
            new Blob([code.toString().replace(/^.*?{\s*|\s*}.*$/g, '')]));
        const wrkr = new Worker(url);
        URL.revokeObjectURL(url);
        wrkr.onmessage = e => {
          if (e.data.init && typeof handler === 'function') {
            wrkr.onmessage = handler;
            resolve(wrkr);
          } else {
            reject(e.data.errorMessage || 'Handler must be a function.');
          }
        };
        wrkr.postMessage({ href, args });
      });
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
