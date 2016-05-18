// Functions to work with HTML
// TODO Get width and height from field object
TRIPLET.html = {

  makeCanvas: function(id, width, height, parent) {
    var canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = width;
    canvas.height = height;
    canvas.innerText = 'Your browser does not support HTML5 Canvas.';
    parent.appendChild(canvas);
    return canvas;
  }

};
