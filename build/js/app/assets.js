"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Add attempt to retry asset downloading on error
// Game assets storage

var Storage = function () {
  function Storage(loader) {
    _classCallCheck(this, Storage);

    this.loader = loader;
    this.finished = 0;
    this.pool = [];
    this.errors = [];
  }

  _createClass(Storage, [{
    key: "load",
    value: function load(loadList, callback) {
      var _this = this;

      function onEnd(save, value) {
        save(value);
        if (++this.finished >= loadList.length) callback();
      }
      loadList.forEach(function (link, index) {
        var onLoad = function onLoad(asset) {
          _this.pool[index] = asset;
        };
        var onError = function onError(info) {
          _this.errors[index] = info;
        };
        _this.loader(link, onEnd.bind(_this, onLoad), onEnd.bind(_this, onError));
      });
    }
  }]);

  return Storage;
}();

define({
  images: new Storage(function (link, onSuccess, onFail) {
    var img = new Image();
    img.src = link;
    img.onload = function () {
      onSuccess(img);
    };
    img.onerror = function () {
      onFail(link);
    };
  })
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC9hc3NldHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0lBRU0sTztBQUVKLG1CQUFZLE1BQVosRUFBb0I7QUFBQTs7QUFDbEIsU0FBSyxNQUFMLEdBQWMsTUFBZDtBQUNBLFNBQUssUUFBTCxHQUFnQixDQUFoQjtBQUNBLFNBQUssSUFBTCxHQUFZLEVBQVo7QUFDQSxTQUFLLE1BQUwsR0FBYyxFQUFkO0FBQ0Q7Ozs7eUJBRUksUSxFQUFVLFEsRUFBVTtBQUFBOztBQUN2QixlQUFTLEtBQVQsQ0FBZSxJQUFmLEVBQXFCLEtBQXJCLEVBQTRCO0FBQzFCLGFBQUssS0FBTDtBQUNBLFlBQUksRUFBRSxLQUFLLFFBQVAsSUFBbUIsU0FBUyxNQUFoQyxFQUF3QztBQUN6QztBQUNELGVBQVMsT0FBVCxDQUFpQixVQUFDLElBQUQsRUFBTyxLQUFQLEVBQWlCO0FBQ2hDLFlBQU0sU0FBUyxTQUFULE1BQVMsUUFBUztBQUFFLGdCQUFLLElBQUwsQ0FBVSxLQUFWLElBQW1CLEtBQW5CO0FBQTJCLFNBQXJEO0FBQ0EsWUFBTSxVQUFVLFNBQVYsT0FBVSxPQUFRO0FBQUUsZ0JBQUssTUFBTCxDQUFZLEtBQVosSUFBcUIsSUFBckI7QUFBNEIsU0FBdEQ7QUFDQSxjQUFLLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLE1BQU0sSUFBTixRQUFpQixNQUFqQixDQUFsQixFQUE0QyxNQUFNLElBQU4sUUFBaUIsT0FBakIsQ0FBNUM7QUFDRCxPQUpEO0FBS0Q7Ozs7OztBQUlILE9BQU87QUFDTCxVQUFRLElBQUksT0FBSixDQUFZLFVBQUMsSUFBRCxFQUFPLFNBQVAsRUFBa0IsTUFBbEIsRUFBNkI7QUFDL0MsUUFBTSxNQUFNLElBQUksS0FBSixFQUFaO0FBQ0EsUUFBSSxHQUFKLEdBQVUsSUFBVjtBQUNBLFFBQUksTUFBSixHQUFhLFlBQU07QUFBRSxnQkFBVSxHQUFWO0FBQWlCLEtBQXRDO0FBQ0EsUUFBSSxPQUFKLEdBQWMsWUFBTTtBQUFFLGFBQU8sSUFBUDtBQUFlLEtBQXJDO0FBQ0QsR0FMTztBQURILENBQVAiLCJmaWxlIjoianMvYXBwL2Fzc2V0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gQWRkIGF0dGVtcHQgdG8gcmV0cnkgYXNzZXQgZG93bmxvYWRpbmcgb24gZXJyb3JcclxuLy8gR2FtZSBhc3NldHMgc3RvcmFnZVxyXG5jbGFzcyBTdG9yYWdlIHtcclxuXHJcbiAgY29uc3RydWN0b3IobG9hZGVyKSB7XHJcbiAgICB0aGlzLmxvYWRlciA9IGxvYWRlcjtcclxuICAgIHRoaXMuZmluaXNoZWQgPSAwO1xyXG4gICAgdGhpcy5wb29sID0gW107XHJcbiAgICB0aGlzLmVycm9ycyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgbG9hZChsb2FkTGlzdCwgY2FsbGJhY2spIHtcclxuICAgIGZ1bmN0aW9uIG9uRW5kKHNhdmUsIHZhbHVlKSB7XHJcbiAgICAgIHNhdmUodmFsdWUpO1xyXG4gICAgICBpZiAoKyt0aGlzLmZpbmlzaGVkID49IGxvYWRMaXN0Lmxlbmd0aCkgY2FsbGJhY2soKTtcclxuICAgIH1cclxuICAgIGxvYWRMaXN0LmZvckVhY2goKGxpbmssIGluZGV4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG9uTG9hZCA9IGFzc2V0ID0+IHsgdGhpcy5wb29sW2luZGV4XSA9IGFzc2V0OyB9O1xyXG4gICAgICBjb25zdCBvbkVycm9yID0gaW5mbyA9PiB7IHRoaXMuZXJyb3JzW2luZGV4XSA9IGluZm87IH07XHJcbiAgICAgIHRoaXMubG9hZGVyKGxpbmssIG9uRW5kLmJpbmQodGhpcywgb25Mb2FkKSwgb25FbmQuYmluZCh0aGlzLCBvbkVycm9yKSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59XHJcblxyXG5kZWZpbmUoe1xyXG4gIGltYWdlczogbmV3IFN0b3JhZ2UoKGxpbmssIG9uU3VjY2Vzcywgb25GYWlsKSA9PiB7XHJcbiAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgIGltZy5zcmMgPSBsaW5rO1xyXG4gICAgaW1nLm9ubG9hZCA9ICgpID0+IHsgb25TdWNjZXNzKGltZyk7IH07XHJcbiAgICBpbWcub25lcnJvciA9ICgpID0+IHsgb25GYWlsKGxpbmspOyB9O1xyXG4gIH0pLFxyXG59KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
