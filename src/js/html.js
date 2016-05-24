// Functions to work with HTML
TRIPLET.html = {

  makeCanvas: function(id, width, height, parent) {
    var canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = width;
    canvas.height = height;
    canvas.innerText = 'Your browser does not support HTML5 Canvas.';
    parent.appendChild(canvas);
    return canvas;
  },

  getClickCoords: function(event) {
    var rect = event.target.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

};
