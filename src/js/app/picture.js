// TODO Lines length can be corrected via reducing frames.total
// TODO Maybe use singleton and check if instance is initialized
// TODO Functions in initialize method are ugly, maybe refactor them
define(['./config', './utilities', './sprite'], (
    { general: cfg, players, elements: { line, sign } }, { random }, Sprite) =>
  // Visualization class
  class Picture {

    constructor(field, canvas) {
      this.field = field;
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d');
      this.sprites = new Set();
      this.builders = {};
    }

    initialize(images) {
      function makeBuilder(imgIndexes) {
        const imgs = imgIndexes.map(id => images[id]);
        imgs[Symbol.iterator] = function iterate() {
          const self = this;
          return {
            next() {
              return { done: false, value: random.item(self) };
            },
          };
        };
        return new Sprite.StandardSpriteBuilder(imgs);
      }

      function colorize(color, value, index) {
        return color[index % 4] || value;
      }

      this.builders.line = line.imgID.map(arr => (
        makeBuilder(arr)
            .modify(colorize.bind(null, line.color))
            .slice(line.frames.total, line.frames.inline)
            .fit(this.field.width, this.field.height)
            .delay(1000 / line.frames.fps)
            .translate()
            .rotate()
            .scale(1, cfg.defaultRowsCols / Math.max(cfg.rows, cfg.columns),
                val => random.sign * val + random.error(line.random.scale))));

      this.builders.sign = sign.imgID.map((arr, id) => (
        makeBuilder(arr)
            .modify(colorize.bind(null, players[id].color || sign.color))
            .slice(sign.frames.total, sign.frames.inline)
            .fit(this.field.cell.width, this.field.cell.height)
            .delay(1000 / sign.frames.fps)
            .translate(undefined, val => val + random.error(sign.random.move))
            .rotate(0, val => val + random.error(sign.random.rotate))
            .scale(1, 1,
                val => random.sign * val + random.error(sign.random.scale))));
    }

    drawSprite(sprite) {
      const clearCanvas = () => {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      };

      const draw = sp => {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        sp.transformations.forEach((values, transformation) => (
            this.ctx[transformation](...values)));
        this.ctx.drawImage(...sp.drawArguments);
      };

      if (sprite instanceof Sprite.Sprite) this.sprites.add(sprite);
      else throw new TypeError(`Argument is not a sprite: ${sprite}`);
      const done = sprite.nextFrame();
      if (!done) {
        setTimeout(this.drawSprite.bind(this, sprite), sprite.timing);
        clearCanvas();
        this.sprites.forEach(draw);
      }
    }

    drawField(lineID = 0) {
      if (this.field.lines.visible[lineID]) {
        const { x, y, angle } = this.field.lines.visible[lineID];
        setTimeout(this.drawField.bind(this, lineID + 1), line.pause);
        this.drawSprite(
            this.builders.line[0].translate(x, y).rotate(angle).build());
      }
    }

    drawSign(row, col, playerID) {
      const { x, y } = this.field.getCellCenter(row, col);
      this.drawSprite(
          this.builders.sign[playerID].translate(x, y).build());
    }

  }
);
