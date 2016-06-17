// Picture graphic element constructor
define(['./utilities', './assets'], ({ props }, { images: { pool: images } }) =>
  class Sprite {

    constructor(setup) {
      this.image = images[setup.imgID];
      const ratio = Math.max(setup.container.width, setup.container.height) /
          Math.max(this.image.width, this.image.height) || 1;

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
