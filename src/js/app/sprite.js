// TODO Correct Sprite class after StandardSpriteBuilder change
// TODO Rewrite colorizing method
// TODO Think about timing saving
define(() => {
  // Builder interface
  class SpriteBuilder {}

  // Picture graphic element
  class Sprite {

    constructor(builder) {
      if (!(builder instanceof SpriteBuilder)) {
        throw new Error(`Can not make sprite without builder: ${builder}`);
      }
      this.transformations = builder.transformations;
      this.image = builder.image;
      this.slicer = builder.slicer();
      this.fps = builder.fps;  // ???
      this.dimentions = builder.dimentions;
      this.position = this.dimentions.map(d => -d / 2);
      this.nextFrame();
    }

    nextFrame() {
      const frame = this.slicer.next();
      if (!frame.done) this.frame = frame.value;
      return !frame.done;
    }

    get drawArguments() {
      return [this.image].concat(this.frame, this.position, this.dimentions);
    }

  }

  // Builder for sprites
  class StandardSpriteBuilder extends SpriteBuilder {

    constructor(images) {
      super();
      this.images = (Array.isArray(images) ? images : [images])
          .filter(img => img instanceof Image);
      if (!this.images.length) {
        throw new Error(`No images in builder: ${images}`);
      }
    }

    get image() {
      if (typeof this.index === 'number') return this.images[this.index];
      for (;;) {
        const img = this.selector ? this.selector.next() : { done: true };
        if (img.done) this.selector = this.images[Symbol.iterator]();
        else return img.value;
      }
    }

    // FINISHED BEFORE

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

    // Unfinished API
    fps(count = 30) {
      this.fps = count;
      return this;
    }

    // FINISHED AFTER

    get shot() {
      return this.frames || this.images[0];
    }

    slice(total, inline) {
      const width = this.images[0].width / inline;
      const height = this.images[0].height / Math.ceil(total / inline);
      this.frames = { width, height, total, inline };
      return this;
    }

    * slicer({ width, height, total = 1, inline = 1 } = this.shot) {
      for (let current = 0; current < total; current++) {
        const x = width * (current % inline);
        const y = height * ~~(current / inline);
        yield [x, y, width, height];
      }
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

    set transformations([type, arg, decorator]) {
      if (!this.transform) this.transform = {};
      this.transform[type] = {
        args: (Array.isArray(arg) ? arg : [arg]).map(v => parseFloat(v) || 0),
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

    build(index) {
      this.index = index;
      return new Sprite(this);
    }

  }

  return { SpriteBuilder, Sprite, StandardSpriteBuilder };
});
