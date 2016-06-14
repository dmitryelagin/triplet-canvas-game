// TODO Lines length can be corrected via reducing frames.total
// TODO Refactor sprite config objects
// TODO All possible sprites should be predefined
// Visualization constructor
import { general as cfg, elements as elem } from './config';
import { random } from './utilities';
import Sprite from './sprite';

export default class Picture {

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
    const line = this.field.lines.visible[lineID];
    if (line) {
      setTimeout(this.drawField.bind(this, lineID + 1), elem.line.pause);
      this.drawSprite(new Sprite({
        imgID: elem.line.random.imgID,
        color: elem.line.color,
        frames: elem.line.frames,
        container: this.field,
        center: { x: line.x, y: line.y },
        angle: line.angle,
        scale: {
          width: random.sign + elem.line.random.scale,
          height: random.sign * cfg.defaultRowsCols /
              Math.max(cfg.rows, cfg.columns) + elem.line.random.scale,
        },
      }));
    }
  }

  drawSign(row, col, player) {
    const cellCenter = this.field.getCellCenter(row, col);
    cellCenter.x += elem.sign.random.move;
    cellCenter.y += elem.sign.random.move;
    this.drawSprite(new Sprite({
      imgID: elem.sign.random.imgID[player.signID],
      color: player.color || elem.sign.color,
      frames: elem.sign.frames,
      container: this.field.cell,
      center: cellCenter,
      angle: elem.sign.random.rotate,
      scale: {
        width: random.sign + elem.sign.random.scale,
        height: random.sign + elem.sign.random.scale,
      },
    }));
  }

}
