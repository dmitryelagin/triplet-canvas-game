// TODO Maybe implement opacity change
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
      this.image = builder.image;
      this.slicer = builder.slicer();
      this.dimentions = builder.dimentions;
      this.position = this.dimentions.map(d => -d / 2);
      this.transformations = builder.transformations;
      this.frame = [];
    }

    nextFrame() {
      const frame = this.slicer.next();
      if (!frame.done) this.frame = frame.value;
      return frame.done;
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
      this.images[Symbol.iterator] = images[Symbol.iterator];
      this.transform = new Map();
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

    modify(modifierFn) {
      const { width, height } = this.images[0];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      function modifyImg(img) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, width, height).data.map(modifierFn);
        ctx.putImageData(new ImageData(data, width, height), 0, 0);
        const nImg = new Image();
        nImg.src = canvas.toDataURL('image/png');
        return nImg;
      }

      try {
        this.images = this.images.map(modifyImg);
      } catch (err) {
        this.error = err;
      }
      return this;
    }

    // FINISHED BEFORE

    // Unfinished API
    fps(count = 30) {
      this.fps = count;
      return this;
    }

    // FINISHED AFTER

    get shot() {
      return this.frames || this.images[0];
    }

    slice(total = 1, inline = 1) {
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
      const size = Math[type](...sizes.filter(n => Number.isFinite(n)));
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
      const map = new Map();
      this.transform.forEach((value, key) => (
          map.set(key, value.args.map((val, i) => value.decorate(val, i)))));
      return map;
    }

    set transformations([key, arg, dec]) {
      const args = arg.map(v => parseFloat(v) || 0);
      let decorate = val => val;
      if (this.transform.has(key)) decorate = this.transform.get(key).decorate;
      if (typeof dec === 'function' && Number.isFinite(dec(0))) decorate = dec;
      this.transform.set(key, { args, decorate });
    }

    translate(x = 0, y = 0, decorate) {
      this.transformations = ['translate', [x, y], decorate];
      return this;
    }

    scale(width = 1, height = 1, decorate) {
      this.transformations = ['scale', [width, height], decorate];
      return this;
    }

    rotate(angle = 0, decorate) {
      this.transformations = ['rotate', [angle], decorate];
      return this;
    }

    build(index) {
      this.index = index;
      return new Sprite(this);
    }

  }

  return { SpriteBuilder, Sprite, StandardSpriteBuilder };
});
