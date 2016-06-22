class Sprite {

  constructor(builder) {
    if (!(builder instanceof SpriteBuilder)) {
      throw new Error(`Can not make sprite without builder: ${builder}`);
    }
    this.transformations = builder.transformations;
    this.image = builder.image;  // This should be a copy?
    this.frame = builder.frame;  // This should remember image index?
    this.dimentions = builder.dimentions;
    this.position = this.dimentions.map(d => -d / 2);
    Object.freeze(this);
  }

  get drawArguments() {
    return;
  }

}

class SpriteBuilder {

  // Add image selector
  constructor(images) {
    this.images = images.slice();
    this.transform = {};
  }

  // Add colorizing function in arguments and body
  colorize(color) {
    const { width, height } = this.image;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    context.drawImage(this.image, 0, 0);
    const img = context.getImageData(0, 0, width, height);
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    const fill = context.getImageData(0, 0, width, height);

    for (let i = img.data.length; i--;) {
      if (i % 4 === 3) fill.data[i] = img.data[i];
    }

    context.putImageData(fill, 0, 0);
    const newImage = new Image();
    newImage.src = canvas.toDataURL('image/png');
    this.image = newImage;
    return this;
  }

  // Returns current image from images pool
  get image() {

  }

  // FINISHED NEXT

  get shot() {
    return this.frame ? this.frame.next(false).value : this.image;
  }

  * framing(total = 1, inline = 1) {
    const width = this.image.width / inline;
    const height = this.image.height / Math.ceil(total / inline);
    let current = 0;
    while (current < total - 1) {
      const x = width * (current % inline);
      const y = height * ~~(current / inline);
      const next = yield { x, y, width, height };
      if (next !== false) current++;
    }
  }

  crop(total, inline) {
    this.frame = this.framing(total, inline);
    return this;
  }

  delay(time = 0) {
    this.delay = time;
    return this;
  }

  get dimentions() {
    const { width, height } = this.shot;
    const ratio = this.maxSize / Math.max(width, height) || 1;
    return [width * ratio, height * ratio];
  }

  set dimentions([type, sizes]) {
    const size = Math[type](...sizes);
    if (size) this.maxSize = size;
  }

  inscribe(...sizes) {
    this.dimentions = ['min', sizes];
    return this;
  }

  fit(...sizes) {
    this.dimentions = ['max', sizes];
    return this;
  }

  get transformations() {
    const obj = {};
    Object.entries(this.transform).forEach(([key, value]) => {
      obj[key] = value.args.map(val => value.decorator(val));
    });
    return obj;
  }

  set transformations([type, args, decorator]) {
    this.transform[type] = {
      args: (Array.isArray(args) ? args : [args]).map(v => parseFloat(v) || 0),
      decorator: typeof decorator === 'function' &&
          typeof decorator(0) === 'number' ? decorator : val => val,
    };
  }

  translate(args = [0, 0], decorator) {
    this.transformations = ['translate', args, decorator];
    return this;
  }

  scale(args = [1, 1], decorator) {
    this.transformations = ['scale', args, decorator];
    return this;
  }

  rotate(args = [0], decorator) {
    this.transformations = ['rotate', args, decorator];
    return this;
  }

  build() {
    return new Sprite(this);
  }

}

// Picture graphic element constructor
define(['./utilities', './assets'], ({ props }, { images: { pool: images } }) =>
  class Sprite {

    constructor(setup) {
      this.image = images[setup.imgID];

      this.angle = parseFloat(setup.angle) || 0;
      this.center = props.fromTo(setup.center, { x: 0, y: 0 });
      this.scale = props.fromTo(setup.scale, { width: 1, height: 1 });

      this.frames = props.fromTo(setup.frames, {
        inRow: 1, total: 1, delay: 0, current: -1,
        next() {
          const hasNext = this.current < this.total - 1;
          if (hasNext) this.current += 1;
          return hasNext;
        },
      });
      this.frames.width = this.image.width / this.frames.inRow;
      this.frames.height = this.image.height /
        Math.ceil(this.frames.total / this.frames.inRow);

      const ratio = Math.max(setup.container.width, setup.container.height) /
          Math.max(this.frames.width, this.frames.height) || 1;

      this.width = this.frames.width * ratio;
      this.height = this.frames.height * ratio;
      this.dx = -this.width / 2;
      this.dy = -this.height / 2;

      try {
        this.changeColor(setup.color || '#000');
      } catch (err) { /* Continue regardless of error */ }
      Object.freeze(this);
    }

    changeColor(color) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = this.image.width;
      canvas.height = this.image.height;

      context.drawImage(this.image, 0, 0);
      const img = context.getImageData(0, 0, canvas.width, canvas.height);
      context.fillStyle = color;
      context.fillRect(0, 0, canvas.width, canvas.height);
      const fill = context.getImageData(0, 0, canvas.width, canvas.height);

      for (let i = img.data.length; i--;) {
        if (i % 4 === 3) fill.data[i] = img.data[i];
      }

      context.putImageData(fill, 0, 0);
      const newImage = new Image();
      newImage.src = canvas.toDataURL('image/png');
      this.image = newImage;
    }

  }
);
