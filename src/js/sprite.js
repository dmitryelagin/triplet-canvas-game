// Picture graphic element constructor
// TODO Implement image colorization
TRIPLET.Sprite = (function() {

var cfg = TRIPLET.config.general,
    uobj = TRIPLET.utilities.object,
    images = TRIPLET.assets.images.pool,
    Sprite;

Sprite = function(setup) {

  var ratio;

  this.image = (function(img) {
    return img;
  })(images[setup.imgID]);

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

return Sprite;

})();
