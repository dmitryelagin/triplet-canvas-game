// TODO Ucomment exponentiation operator later
// Lines class, using slope–intercept form for setup
define(() =>
  class Line {

    constructor({ x = 0, y = 0, angle = 0 }) {
      this.angle = parseFloat(angle) % (Math.PI * 2);
      this.x = parseFloat(x);
      this.y = parseFloat(y);
      this.a = Math.tan(this.angle);
      this.b = -1;
      this.c = this.y - this.a * this.x;
      if (Object.keys(this).every(p => Number.isFinite(this[p]))) {
        Object.freeze(this);
      } else throw new Error(`Wrong line setup: ${x} / ${y} / ${angle}`);
    }

    static isLine(line) {
      if (line instanceof Line) return line;
      throw new TypeError(`Argument is not instance of Line: ${line}`);
    }

    distanceFrom(x = 0, y = 0) {
      const { a, b, c } = this;
      // const distance = (a * x + b * y + c) / Math.sqrt(a ** 2 + b ** 2);
      const distance = (a * x + b * y + c) /
          Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
      if (Number.isFinite(distance)) return distance;
      throw new Error(`Wrong point coordinates: ${x} / ${y}`);
    }

    intersects(line, accuracy = 8) {
      this.constructor.isLine(line);
      const divider = this.a * line.b - line.a * this.b;
      return divider === 0 ? null : {
        x: -((this.c * line.b - line.c * this.b) / divider).toFixed(accuracy),
        y: -((this.a * line.c - line.a * this.c) / divider).toFixed(accuracy),
      };
    }

    getBisector(line) {
      this.constructor.isLine(line);
      return new Line({
        x: (this.x + line.x) / 2,
        y: (this.y + line.y) / 2,
        angle: (this.angle + line.angle) / 2,
      });
    }

  }
);
