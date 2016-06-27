// TODO Check arguments and think of exeptions
// TODO Load method is ugly, refactor it
// Game assets storage
class Storage {

  constructor(loader) {
    this.loader = loader;
    this.pool = [];
  }

  load(loadList, retries = 2) {
    return new Promise((resolve, reject) => {
      loadList.forEach((url, index) => {
        (function loadAsset(attempts) {
          this.loader(url).then(asset => {
            if (this.pool.push([index, asset]) === loadList.length) {
              this.pool = this.pool.sort((a, b) => a[0] - b[0]).map(v => v[1]);
              resolve(this.pool);
            }
          }, error => {
            if (attempts) loadAsset.call(this, attempts - 1);
            else reject(error);
          });
        }.call(this, retries));
      });
    });
  }

}

define({
  images: new Storage(url => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { resolve(img); };
    img.onerror = () => { reject(url); };
    img.src = url;
  })),
});
