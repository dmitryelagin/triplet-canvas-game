// TODO Remove this.canvas if not needed
// TODO Maybe apply singleton and decorator patterns
// Field constructor
define(['./config', './line', './utilities'], ({
      general: { rows, columns, size, left, right, top, bottom },
      elements: { line },
    }, Line, { random }) =>
  class Field {

    constructor() {
      const cellSize = Math.min(size / columns, size / rows);
      this.width = cellSize * columns;
      this.height = cellSize * rows;
      this.cell = { width: cellSize, height: cellSize };
      this.canvas = {
        width: left + this.width + right,
        height: top + this.height + bottom,
      };

      this.lines = (() => {
        function randomize({ x, y, angle }) {
          return {
            x: x + random.error(line.random.move),
            y: y + random.error(line.random.move),
            angle: angle + random.error(line.random.rotate),
          };
        }

        function linesFactory(count, getLineCfg) {
          const storage = [];
          for (let i = 0; i <= count; i++) {
            storage.push(new Line(i % count === 0
              ? getLineCfg(i)
              : randomize(getLineCfg(i))));
          }
          return storage;
        }

        return {
          hor: linesFactory(rows, index => ({
            x: left + this.width / 2,
            y: top + this.cell.height * index,
            angle: 0,
          })),
          ver: linesFactory(columns, index => ({
            x: left + this.cell.width * index,
            y: top + this.height / 2,
            angle: Math.PI / 2,
          })),
        };
      })();

      this.lines.visible =
          this.lines.ver.slice(1, -1).concat(this.lines.hor.slice(1, -1));
      Object.freeze(this);
    }

    getCellCenter(row, col) {
      const rowAxis = this.lines.hor[row].getBisector(this.lines.hor[row + 1]);
      const colAxis = this.lines.ver[col].getBisector(this.lines.ver[col + 1]);
      return rowAxis.intersects(colAxis);
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
);
