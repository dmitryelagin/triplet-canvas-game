// Lines constructor, using slope–intercept form
TRIPLET.Line = (function() {

var Line = function(setup) {
  this.x = parseFloat(setup.x) || 0;
  this.y = parseFloat(setup.y) || 0;
  this.angle = parseFloat(setup.angle) || 0;
  Object.freeze(this);
};

Line.validate = function(line) {
  if (line instanceof Line) return line;
  throw new TypeError('Argument is not instance of Line: ' + line);
};

Line.prototype = {

  constructor: TRIPLET.Line,

  getFactors: function() {
    var slope = Math.tan(this.angle);
    return {
      a: slope,
      b: -1,
      c: this.y - slope * this.x
    };
  },

  distanceFrom: function(x, y) {
    var line = this.getFactors(),
        distance = (line.a * x + line.b * y + line.c) /
            Math.sqrt(Math.pow(line.a, 2) + Math.pow(line.b, 2));
    if (typeof distance === 'number' && !isNaN(distance)) return distance;
    throw new TypeError('Wrong point coordinates: ' + x + ' / ' + y);
  },

  intersects: function(line) {
    var ln0 = this.getFactors(),
        ln1 = Line.validate(line).getFactors(),
        divider = ln0.a * ln1.b - ln1.a * ln0.b;
    if (divider !== 0)
      return {
        x: -(ln0.c * ln1.b - ln1.c * ln0.b) / divider,
        y: -(ln0.a * ln1.c - ln1.a * ln0.c) / divider
      };
  },

  getBisector: function(line) {
    Line.validate(line);
    return new Line({
      x: (this.x + line.x) / 2,
      y: (this.y + line.y) / 2,
      angle: (this.angle + line.angle) / 2
    });
  }

};

return Line;

})();
