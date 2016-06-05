// Picture graphic element constructor
// TODO Implement image colorization
TRIPLET.Sprite = (function() {

var cfg = TRIPLET.config.general,
    uobj = TRIPLET.utilities.object,
    images = TRIPLET.assets.images.pool,
    Sprite;

Sprite = function(setup) {

  var ratio;

  this.image = images[setup.imgID];
  //this.colorize(setup.color || '000000');

  ratio = Math.max(setup.container.width, setup.container.height) /
      Math.max(this.image.width, this.image.height) || 1;

  this.angle = parseFloat(setup.angle) || 0;
  this.center = uobj.propFromTo(setup.center, { x: 0, y: 0 });
  this.scale = uobj.propFromTo(setup.scale, { width: 1, height: 1 });
  this.frames = uobj.propFromTo(setup.frames, {
    inRow: 1, total: 1, delay: 0, current: -1
  });
  this.frames.width = this.image.width / this.frames.inRow;
  this.frames.height = this.image.height /
    Math.ceil(this.frames.total / this.frames.inRow);
  this.width = this.frames.width * ratio;
  this.height = this.frames.height * ratio;
  this.dx = -this.width / 2;
  this.dy = -this.height / 2;

  Object.freeze(this);

};

Sprite.prototype = {

  constructor: TRIPLET.Sprite,

  colorize: function(colorStr) {

    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        colorToSet = [
          hex2int(colorStr.substr(0, 2)),  // Red
          hex2int(colorStr.substr(2, 2)),  // Green
          hex2int(colorStr.substr(4, 2))   // Blue
        ],
        i, imgData;

    function hex2int(str) {
      return parseInt(str, 16) || 0;
    }

    function makeImageData(img) {
      img.crossOrigin = 'anonymous';
      context.drawImage(img, 0, 0);
      return context.getImageData(0, 0, img.width, img.height);
    }

    function saveNewImage(self) {
      var img = new Image();
      context.putImageData(imgData, 0, 0);
      img.src = canvas.toDataURL('image/png');
      img.onload = function() { self.image = img; };
    }

    imgData = makeImageData(this.image);
    for (i = imgData.data.length; i--;)
      if (i % 4 !== 3) imgData.data[i] = colorToSet[i % 4];
    saveNewImage(this);

  }

};

return Sprite;

})();
