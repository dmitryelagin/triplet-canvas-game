// TODO Add attempt to retry asset downloading on error
// Game assets storage
class Storage {

  constructor(loader) {
    this.loader = loader;
    this.finished = 0;
    this.pool = [];
    this.errors = [];
  }

  load(loadList, callback) {
    function onEnd(save, value) {
      save(value);
      if (++this.finished >= loadList.length) callback();
    }
    loadList.forEach((link, index) => {
      const onLoad = asset => { this.pool[index] = asset; };
      const onError = info => { this.errors[index] = info; };
      this.loader(link, onEnd.bind(this, onLoad), onEnd.bind(this, onError));
    });
  }

}

define({
  images: new Storage((link, onSuccess, onFail) => {
    const img = new Image();
    img.src = link;
    img.onload = () => { onSuccess(img); };
    img.onerror = () => { onFail(link); };
  }),
});
