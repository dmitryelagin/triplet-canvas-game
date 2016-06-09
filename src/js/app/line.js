// TODO Delete distance method if not needed
// TODO Maybe rewrite constructor and bisector method to keep angle in PI range
// Lines constructor, using slope–intercept form for setup
TRIPLET.Line = (function() {

var Line = function(setup) {
  this.angle = parseFloat(setup.angle) % (Math.PI * 2) || 0;
  this.x = parseFloat(setup.x) || 0;
  this.y = parseFloat(setup.y) || 0;
  this.a = Math.tan(this.angle);
  this.b = -1;
  this.c = this.y - this.a * this.x;
  Object.freeze(this);
};

Line.isLine = function(line) {
  if (line instanceof Line) return line;
  throw new TypeError('Argument is not instance of Line: ' + line);
};

Line.prototype = {

  constructor: TRIPLET.Line,

  distanceFrom: function(x, y) {
    var distance = (this.a * x + this.b * y + this.c) /
        Math.sqrt(Math.pow(this.a, 2) + Math.pow(this.b, 2));
    if (typeof distance === 'number' && !isNaN(distance)) return distance;
    throw new TypeError('Wrong point coordinates: ' + x + ' / ' + y);
  },

  intersects: function(line, accuracy) {
    var divider;
    Line.isLine(line);
    accuracy = accuracy || 8;
    divider = this.a * line.b - line.a * this.b;
    if (divider !== 0)
      return {
        x: -((this.c * line.b - line.c * this.b) / divider).toFixed(accuracy),
        y: -((this.a * line.c - line.a * this.c) / divider).toFixed(accuracy)
      };
  },

  getBisector: function(line) {
    Line.isLine(line);
    return new Line({
      x: (this.x + line.x) / 2,
      y: (this.y + line.y) / 2,
      angle: (this.angle + line.angle) / 2
    });
  }

};

return Line;

})();
