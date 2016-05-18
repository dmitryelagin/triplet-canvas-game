// Visualization constructor
// TODO Lines length can be corrected via reducing frames.total
// TODO Refactor sprite config objects
TRIPLET.Picture = (function() {

  var cfg = TRIPLET.config.general,
      random = TRIPLET.utilities.random,
      elem = TRIPLET.config.element,
      Sprite = TRIPLET.Sprite,
      Picture;

  Picture = function(canvas, field, control) {
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.field = field;
    this.sprites = [];
    this.canvas.addEventListener('click', control.onClick);
  };

  Picture.prototype = {

    constructor: TRIPLET.Picture,

    drawSprite: function(sprite) {

      function clearCanvas() {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      function draw(sp) {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.translate(sp.center.x, sp.center.y);
        this.context.rotate(sp.angle);
        this.context.scale(sp.scale.width, sp.scale.height);
        this.context.drawImage(
            sp.image,
            sp.frames.width * (sp.frames.current % sp.frames.inRow),
            sp.frames.height * ~~(sp.frames.current / sp.frames.inRow),
            sp.frames.width,
            sp.frames.height,
            sp.dx,
            sp.dy,
            sp.width,
            sp.height);
      }

      if (!(sprite instanceof Sprite))
        throw new TypeError('Argument is not Sprite: ' + sprite);
      if (!~sprite.frames.current) this.sprites.push(sprite);
      if (sprite.frames.total - 1 > ++sprite.frames.current)
        setTimeout(this.drawSprite.bind(this, sprite), sprite.frames.delay);
      clearCanvas.call(this);
      this.sprites.forEach(draw, this);

    },

    drawField: function(lineID) {
      lineID = lineID || 0;
      var line = this.field.lines.visible[lineID];
      if (line) {
        setTimeout(this.drawField.bind(this, lineID + 1), elem.line.pause);
        this.drawSprite(new Sprite({
          imgID: elem.line.random.imgID,
          frames: elem.line.frames,
          container: this.field,
          center: { x: line.x, y: line.y },
          angle: line.angle,
          scale: {
            width: random.sign() * cfg.defaultRowsCols / cfg.columns +
              elem.line.random.scale,
            height: random.sign() + elem.line.random.scale
          }
        }));
      }
    },

    drawSign: function(row, col, player) {
      var cellCenter = this.field.getCellCenter(row, col);
      cellCenter.x += elem.sign.random.move;
      cellCenter.y += elem.sign.random.move;
      this.drawSprite(new Sprite({
        imgID: elem.sign.random.imgID[player.signID],
        frames: elem.sign.frames,
        container: this.field.cell,
        center: cellCenter,
        angle: elem.sign.random.rotate,
        scale: {
          width: random.sign() + elem.sign.random.scale,
          height: random.sign() + elem.sign.random.scale
        }
      }));
    }

  };

  return Picture;

})();
