// Field constructor
TRIPLET.Field = (function() {

var cfg = TRIPLET.config.general,
    elem = TRIPLET.config.element,
    Line = TRIPLET.Line,
    Field;

Field = function() {

  var cellSize = Math.min(cfg.size / cfg.columns, cfg.size / cfg.rows);

  this.width = cellSize * cfg.columns;
  this.height = cellSize * cfg.rows;
  this.cell = { width: cellSize, height: cellSize };
  this.canvas = {
    width: cfg.left + this.width + cfg.right,
    height: cfg.top + this.height + cfg.bottom
  };

  this.lines = (function(self) {

    var lineDefaults = {
          hor: { x: cfg.left + self.width / 2, angle: 0 },
          ver: { y: cfg.top + self.height / 2, angle: Math.PI / 2 }
        };

    function linesFactory(count, getCfg) {
      var i, lineCfg, storage = [];
      for (i = 0; i <= count; i++) {
        lineCfg = getCfg(i);
        if (i !== 0 && i !== count) {
          lineCfg.x += elem.line.random.move;
          lineCfg.y += elem.line.random.move;
          lineCfg.angle += elem.line.random.rotate;
        }
        storage.push(new Line(lineCfg));
      }
      return storage;
    }

    return {
      hor: linesFactory(cfg.rows, function(index) {
        lineDefaults.hor.y = cfg.top + self.cell.height * index;
        return lineDefaults.hor;
      }),
      ver: linesFactory(cfg.columns, function(index) {
        lineDefaults.ver.x = cfg.left + self.cell.width * index;
        return lineDefaults.ver;
      })
    };

  })(this);

  this.lines.visible = (function(ln) {
    return ln.ver.slice(1, -1).concat(ln.hor.slice(1, -1));
  })(this.lines);

  Object.freeze(this);

};

Field.prototype = {

  constructor: TRIPLET.Field,

  getCellCenter: function(row, col) {
    var rowCenter = this.lines.hor[row].getBisector(this.lines.hor[row + 1]),
        colCenter = this.lines.ver[col].getBisector(this.lines.ver[col + 1]);
    return rowCenter.intersects(colCenter);
  },

  getCellPosition: function(x, y) {
    function getPosition(lines) {
      var ln, dist, dotAfterLine, i = 0;
      do {
        ln = lines[i];
        dist = ln.distanceFrom(x, y);
        dotAfterLine = dist < 0 && ln.angle > 0 || dist >= 0 && ln.angle <= 0;
      } while (dotAfterLine && ++i < lines.length);
      return i;
    }
    return {
      row: getPosition(this.lines.hor.slice(1, -1)),
      col: getPosition(this.lines.ver.slice(1, -1))
    };
  }

};

return Field;

})();
