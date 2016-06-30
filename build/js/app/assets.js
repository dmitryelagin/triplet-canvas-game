"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(function () {
  // Game assets storage class

  var Storage = function () {
    function Storage(loader) {
      _classCallCheck(this, Storage);

      this.loader = loader;
      this.pool = [];
    }

    _createClass(Storage, [{
      key: "load",
      value: function load(links) {
        var _this2 = this;

        var retries = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];
        var delay = arguments.length <= 2 || arguments[2] === undefined ? 200 : arguments[2];

        function loadAsset(url, i, a) {
          var _this = this;

          var attempts = arguments.length <= 3 || arguments[3] === undefined ? retries : arguments[3];
          var wait = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

          return new Promise(function (fn) {
            return setTimeout(fn, wait);
          }).then(function () {
            return _this.loader(url).catch(function (error) {
              return attempts ? loadAsset.call(_this, url, i, a, attempts - 1, delay) : new Error("Asset was not loaded: " + error);
            });
          });
        }

        return new Promise(function (resolve, reject) {
          Promise.all(links.map(loadAsset, _this2)).then(function (results) {
            results.forEach(function (val) {
              return _this2.pool.push(val);
            });
            if (_this2.pool.some(function (e) {
              return e instanceof Error;
            })) reject(_this2.pool);else resolve(_this2.pool);
          });
        });
      }
    }]);

    return Storage;
  }();

  // Storages


  var images = new Storage(function (url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(url);
      };
      img.src = url;
    });
  });

  return { Storage: Storage, images: images };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC9hc3NldHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsT0FBTyxZQUFNOzs7QUFBQSxNQUVMLE9BRks7QUFJVCxxQkFBWSxNQUFaLEVBQW9CO0FBQUE7O0FBQ2xCLFdBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxXQUFLLElBQUwsR0FBWSxFQUFaO0FBQ0Q7O0FBUFE7QUFBQTtBQUFBLDJCQVNKLEtBVEksRUFTNkI7QUFBQTs7QUFBQSxZQUExQixPQUEwQix5REFBaEIsQ0FBZ0I7QUFBQSxZQUFiLEtBQWEseURBQUwsR0FBSzs7QUFDcEMsaUJBQVMsU0FBVCxDQUFtQixHQUFuQixFQUF3QixDQUF4QixFQUEyQixDQUEzQixFQUE0RDtBQUFBOztBQUFBLGNBQTlCLFFBQThCLHlEQUFuQixPQUFtQjtBQUFBLGNBQVYsSUFBVSx5REFBSCxDQUFHOztBQUMxRCxpQkFBTyxJQUFJLE9BQUosQ0FBWTtBQUFBLG1CQUFNLFdBQVcsRUFBWCxFQUFlLElBQWYsQ0FBTjtBQUFBLFdBQVosRUFBd0MsSUFBeEMsQ0FBNkM7QUFBQSxtQkFDbEQsTUFBSyxNQUFMLENBQVksR0FBWixFQUFpQixLQUFqQixDQUF1QjtBQUFBLHFCQUFVLFdBQzdCLFVBQVUsSUFBVixRQUFxQixHQUFyQixFQUEwQixDQUExQixFQUE2QixDQUE3QixFQUFnQyxXQUFXLENBQTNDLEVBQThDLEtBQTlDLENBRDZCLEdBRTdCLElBQUksS0FBSiw0QkFBbUMsS0FBbkMsQ0FGbUI7QUFBQSxhQUF2QixDQURrRDtBQUFBLFdBQTdDLENBQVA7QUFJRDs7QUFFRCxlQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsa0JBQVEsR0FBUixDQUFZLE1BQU0sR0FBTixDQUFVLFNBQVYsU0FBWixFQUF3QyxJQUF4QyxDQUE2QyxtQkFBVztBQUN0RCxvQkFBUSxPQUFSLENBQWdCO0FBQUEscUJBQU8sT0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLEdBQWYsQ0FBUDtBQUFBLGFBQWhCO0FBQ0EsZ0JBQUksT0FBSyxJQUFMLENBQVUsSUFBVixDQUFlO0FBQUEscUJBQUssYUFBYSxLQUFsQjtBQUFBLGFBQWYsQ0FBSixFQUE2QyxPQUFPLE9BQUssSUFBWixFQUE3QyxLQUNLLFFBQVEsT0FBSyxJQUFiO0FBQ04sV0FKRDtBQUtELFNBTk0sQ0FBUDtBQU9EO0FBeEJROztBQUFBO0FBQUE7Ozs7O0FBNkJYLE1BQU0sU0FBUyxJQUFJLE9BQUosQ0FBWTtBQUFBLFdBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUNqRSxVQUFNLE1BQU0sSUFBSSxLQUFKLEVBQVo7QUFDQSxVQUFJLE1BQUosR0FBYSxZQUFNO0FBQUUsZ0JBQVEsR0FBUjtBQUFlLE9BQXBDO0FBQ0EsVUFBSSxPQUFKLEdBQWMsWUFBTTtBQUFFLGVBQU8sR0FBUDtBQUFjLE9BQXBDO0FBQ0EsVUFBSSxHQUFKLEdBQVUsR0FBVjtBQUNELEtBTGlDLENBQVA7QUFBQSxHQUFaLENBQWY7O0FBT0EsU0FBTyxFQUFFLGdCQUFGLEVBQVcsY0FBWCxFQUFQO0FBQ0QsQ0FyQ0QiLCJmaWxlIjoianMvYXBwL2Fzc2V0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImRlZmluZSgoKSA9PiB7XHJcbiAgLy8gR2FtZSBhc3NldHMgc3RvcmFnZSBjbGFzc1xyXG4gIGNsYXNzIFN0b3JhZ2Uge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGxvYWRlcikge1xyXG4gICAgICB0aGlzLmxvYWRlciA9IGxvYWRlcjtcclxuICAgICAgdGhpcy5wb29sID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZChsaW5rcywgcmV0cmllcyA9IDIsIGRlbGF5ID0gMjAwKSB7XHJcbiAgICAgIGZ1bmN0aW9uIGxvYWRBc3NldCh1cmwsIGksIGEsIGF0dGVtcHRzID0gcmV0cmllcywgd2FpdCA9IDApIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZm4gPT4gc2V0VGltZW91dChmbiwgd2FpdCkpLnRoZW4oKCkgPT4gKFxyXG4gICAgICAgICAgdGhpcy5sb2FkZXIodXJsKS5jYXRjaChlcnJvciA9PiAoYXR0ZW1wdHNcclxuICAgICAgICAgICAgPyBsb2FkQXNzZXQuY2FsbCh0aGlzLCB1cmwsIGksIGEsIGF0dGVtcHRzIC0gMSwgZGVsYXkpXHJcbiAgICAgICAgICAgIDogbmV3IEVycm9yKGBBc3NldCB3YXMgbm90IGxvYWRlZDogJHtlcnJvcn1gKSkpKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgUHJvbWlzZS5hbGwobGlua3MubWFwKGxvYWRBc3NldCwgdGhpcykpLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICAgICAgICByZXN1bHRzLmZvckVhY2godmFsID0+IHRoaXMucG9vbC5wdXNoKHZhbCkpO1xyXG4gICAgICAgICAgaWYgKHRoaXMucG9vbC5zb21lKGUgPT4gZSBpbnN0YW5jZW9mIEVycm9yKSkgcmVqZWN0KHRoaXMucG9vbCk7XHJcbiAgICAgICAgICBlbHNlIHJlc29sdmUodGhpcy5wb29sKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gU3RvcmFnZXNcclxuICBjb25zdCBpbWFnZXMgPSBuZXcgU3RvcmFnZSh1cmwgPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICBpbWcub25sb2FkID0gKCkgPT4geyByZXNvbHZlKGltZyk7IH07XHJcbiAgICBpbWcub25lcnJvciA9ICgpID0+IHsgcmVqZWN0KHVybCk7IH07XHJcbiAgICBpbWcuc3JjID0gdXJsO1xyXG4gIH0pKTtcclxuXHJcbiAgcmV0dXJuIHsgU3RvcmFnZSwgaW1hZ2VzIH07XHJcbn0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
