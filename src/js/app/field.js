// TODO Remove this.canvas if not needed
// Field constructor
import { general as cfg, elements as elem } from './config';
import Line from './line';

export default class Field {

  constructor() {
    const cellSize = Math.min(cfg.size / cfg.columns, cfg.size / cfg.rows);
    this.width = cellSize * cfg.columns;
    this.height = cellSize * cfg.rows;
    this.cell = { width: cellSize, height: cellSize };
    this.canvas = {
      width: cfg.left + this.width + cfg.right,
      height: cfg.top + this.height + cfg.bottom,
    };

    this.lines = (() => {
      function randomize({ x, y, angle }) {
        return {
          x: x + elem.line.random.move,
          y: y + elem.line.random.move,
          angle: angle + elem.line.random.rotate,
        };
      }

      function linesFactory(count, getLineCfg) {
        const storage = [];
        for (let i = 0; i <= count; i++) {
          storage.push(new Line(
              i % count === 0 ? getLineCfg(i) : randomize(getLineCfg(i))));
        }
        return storage;
      }

      return {
        hor: linesFactory(cfg.rows, index => ({
          x: cfg.left + this.width / 2,
          y: cfg.top + this.cell.height * index,
          angle: 0,
        })),
        ver: linesFactory(cfg.columns, index => ({
          x: cfg.left + this.cell.width * index,
          y: cfg.top + this.height / 2,
          angle: Math.PI / 2,
        })),
      };
    })();

    this.lines.visible =
        this.lines.ver.slice(1, -1).concat(this.lines.hor.slice(1, -1));
    Object.freeze(this);
  }

  getCellCenter(row, col) {
    const rowCenter = this.lines.hor[row].getBisector(this.lines.hor[row + 1]);
    const colCenter = this.lines.ver[col].getBisector(this.lines.ver[col + 1]);
    return rowCenter.intersects(colCenter);
  }

  getCellPosition(x, y) {
    const horizontal = new Line({ x, y, angle: 0 });
    const vertical = new Line({ x, y, angle: Math.PI / 2 });
    function getPosition(lines, ruler) {
      const dotBeforeLine = lines.findIndex(ln =>
        (point => point.x > x || point.y > y)(ln.intersects(ruler)));
      return ~dotBeforeLine ? dotBeforeLine : lines.length;
    }
    return {
      row: getPosition(this.lines.hor.slice(1, -1), vertical),
      col: getPosition(this.lines.ver.slice(1, -1), horizontal),
    };
  }

}
