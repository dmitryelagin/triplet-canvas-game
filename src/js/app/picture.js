// TODO Lines length can be corrected via reducing frames.total
// TODO Refactor sprite config objects
// TODO All possible sprites should be predefined
// Visualization constructor
define(['./config', './utilities', './sprite'], (
    { general: cfg, elements: { line, sign } }, { random }, Sprite) =>
  class Picture {

    constructor(field, canvas) {
      this.field = field;
      this.canvas = canvas;
      this.context = this.canvas.getContext('2d');
      this.sprites = [];
    }

    drawSprite(sprite) {
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

      if (!(sprite instanceof Sprite)) {
        throw new TypeError(`Argument is not a sprite: ${sprite}`);
      }
      if (!~sprite.frames.current) this.sprites.push(sprite);
      if (sprite.frames.next()) {
        setTimeout(this.drawSprite.bind(this, sprite), sprite.frames.delay);
      }
      clearCanvas.call(this);
      this.sprites.forEach(draw, this);
    }

    drawField(lineID = 0) {
      const ln = this.field.lines.visible[lineID];
      if (ln) {
        setTimeout(this.drawField.bind(this, lineID + 1), line.pause);
        this.drawSprite(new Sprite({
          imgID: line.random.imgID,
          color: line.color,
          frames: line.frames,
          container: this.field,
          center: { x: ln.x, y: ln.y },
          angle: ln.angle,
          scale: {
            width: random.sign + line.random.scale,
            height: random.sign * cfg.defaultRowsCols /
                Math.max(cfg.rows, cfg.columns) + line.random.scale,
          },
        }));
      }
    }

    drawSign(row, col, player) {
      const cellCenter = this.field.getCellCenter(row, col);
      cellCenter.x += sign.random.move;
      cellCenter.y += sign.random.move;
      this.drawSprite(new Sprite({
        imgID: sign.random.imgID[player.signID],
        color: player.color || sign.color,
        frames: sign.frames,
        container: this.field.cell,
        center: cellCenter,
        angle: sign.random.rotate,
        scale: {
          width: random.sign + sign.random.scale,
          height: random.sign + sign.random.scale,
        },
      }));
    }

  }
);
