// Picture graphic element constructor
// TODO Function should work if colorization failed
TRIPLET.Sprite = (function() {

var cfg = TRIPLET.config.general,
    uobj = TRIPLET.utilities.object,
    images = TRIPLET.assets.images.pool,
    Sprite;

Sprite = function(setup) {

  var ratio;

  this.image = images[setup.imgID];
  try {
    this.changeColor(setup.color || '#000');
  } catch (err) {}

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

  constructor: Sprite,

  changeColor: function(color) {

    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        newImage = new Image(),
        i, imgData, fillData;
    canvas.width = this.image.width;
    canvas.height = this.image.height;

    context.drawImage(this.image, 0, 0);
    imgData = context.getImageData(0, 0, canvas.width, canvas.height);

    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    fillData = context.getImageData(0, 0, canvas.width, canvas.height);

    for (i = imgData.data.length; i--;)
      if (i % 4 === 3) fillData.data[i] = imgData.data[i];

    context.putImageData(fillData, 0, 0);
    newImage.src = canvas.toDataURL('image/png');
    this.image = newImage;

  }

};

return Sprite;

})();
