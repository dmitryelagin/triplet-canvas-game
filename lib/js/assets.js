'use strict';

// Game assets storage
TRIPLET.assets = function () {

  var Storage = function Storage(loader) {
    this.loader = loader;
    this.finished = 0;
    this.pool = [];
    this.errors = [];
  };

  Storage.prototype = {

    constructor: Storage,

    load: function load(loadList, callback) {
      function onEnd(save, value) {
        save.call(this, value);
        if (++this.finished >= loadList.length) callback();
      }
      loadList.forEach(function (link, index) {
        function onLoad(asset) {
          this.pool[index] = asset;
        }
        function onError(info) {
          this.errors[index] = info;
        }
        this.loader(link, onEnd.bind(this, onLoad), onEnd.bind(this, onError));
      }, this);
      this.load = typeof callback === 'function' ? callback : function () {};
    }

  };

  return {
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
  };
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2Fzc2V0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxRQUFRLE1BQVIsR0FBa0IsWUFBVzs7QUFFN0IsTUFBSSxVQUFVLFNBQVYsT0FBVSxDQUFTLE1BQVQsRUFBaUI7QUFDN0IsU0FBSyxNQUFMLEdBQWMsTUFBZDtBQUNBLFNBQUssUUFBTCxHQUFnQixDQUFoQjtBQUNBLFNBQUssSUFBTCxHQUFZLEVBQVo7QUFDQSxTQUFLLE1BQUwsR0FBYyxFQUFkO0FBQ0QsR0FMRDs7QUFPQSxVQUFRLFNBQVIsR0FBb0I7O0FBRWxCLGlCQUFhLE9BRks7O0FBSWxCLFVBQU0sY0FBUyxRQUFULEVBQW1CLFFBQW5CLEVBQTZCO0FBQ2pDLGVBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUIsS0FBckIsRUFBNEI7QUFDMUIsYUFBSyxJQUFMLENBQVUsSUFBVixFQUFnQixLQUFoQjtBQUNBLFlBQUksRUFBRSxLQUFLLFFBQVAsSUFBbUIsU0FBUyxNQUFoQyxFQUF3QztBQUN6QztBQUNELGVBQVMsT0FBVCxDQUFpQixVQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCO0FBQ3JDLGlCQUFTLE1BQVQsQ0FBZ0IsS0FBaEIsRUFBdUI7QUFDckIsZUFBSyxJQUFMLENBQVUsS0FBVixJQUFtQixLQUFuQjtBQUNEO0FBQ0QsaUJBQVMsT0FBVCxDQUFpQixJQUFqQixFQUF1QjtBQUNyQixlQUFLLE1BQUwsQ0FBWSxLQUFaLElBQXFCLElBQXJCO0FBQ0Q7QUFDRCxhQUFLLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLE1BQU0sSUFBTixDQUFXLElBQVgsRUFBaUIsTUFBakIsQ0FBbEIsRUFBNEMsTUFBTSxJQUFOLENBQVcsSUFBWCxFQUFpQixPQUFqQixDQUE1QztBQUNELE9BUkQsRUFRRyxJQVJIO0FBU0EsV0FBSyxJQUFMLEdBQVksT0FBTyxRQUFQLEtBQW9CLFVBQXBCLEdBQWlDLFFBQWpDLEdBQTRDLFlBQVcsQ0FBRSxDQUFyRTtBQUNEOztBQW5CaUIsR0FBcEI7O0FBdUJBLFNBQU87QUFDTCxZQUFRLElBQUksT0FBSixDQUFZLFVBQVMsSUFBVCxFQUFlLFNBQWYsRUFBMEIsTUFBMUIsRUFBa0M7QUFDcEQsVUFBSSxNQUFNLElBQUksS0FBSixFQUFWO0FBQ0EsVUFBSSxHQUFKLEdBQVUsSUFBVjtBQUNBLFVBQUksTUFBSixHQUFhLFlBQVc7QUFBRSxrQkFBVSxHQUFWO0FBQWlCLE9BQTNDO0FBQ0EsVUFBSSxPQUFKLEdBQWMsWUFBVztBQUFFLGVBQU8sSUFBUDtBQUFlLE9BQTFDO0FBQ0QsS0FMTztBQURILEdBQVA7QUFTQyxDQXpDZ0IsRUFBakIiLCJmaWxlIjoianMvYXNzZXRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gR2FtZSBhc3NldHMgc3RvcmFnZVxyXG5UUklQTEVULmFzc2V0cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbnZhciBTdG9yYWdlID0gZnVuY3Rpb24obG9hZGVyKSB7XHJcbiAgdGhpcy5sb2FkZXIgPSBsb2FkZXI7XHJcbiAgdGhpcy5maW5pc2hlZCA9IDA7XHJcbiAgdGhpcy5wb29sID0gW107XHJcbiAgdGhpcy5lcnJvcnMgPSBbXTtcclxufTtcclxuXHJcblN0b3JhZ2UucHJvdG90eXBlID0ge1xyXG5cclxuICBjb25zdHJ1Y3RvcjogU3RvcmFnZSxcclxuXHJcbiAgbG9hZDogZnVuY3Rpb24obG9hZExpc3QsIGNhbGxiYWNrKSB7XHJcbiAgICBmdW5jdGlvbiBvbkVuZChzYXZlLCB2YWx1ZSkge1xyXG4gICAgICBzYXZlLmNhbGwodGhpcywgdmFsdWUpO1xyXG4gICAgICBpZiAoKyt0aGlzLmZpbmlzaGVkID49IGxvYWRMaXN0Lmxlbmd0aCkgY2FsbGJhY2soKTtcclxuICAgIH1cclxuICAgIGxvYWRMaXN0LmZvckVhY2goZnVuY3Rpb24obGluaywgaW5kZXgpIHtcclxuICAgICAgZnVuY3Rpb24gb25Mb2FkKGFzc2V0KSB7XHJcbiAgICAgICAgdGhpcy5wb29sW2luZGV4XSA9IGFzc2V0O1xyXG4gICAgICB9XHJcbiAgICAgIGZ1bmN0aW9uIG9uRXJyb3IoaW5mbykge1xyXG4gICAgICAgIHRoaXMuZXJyb3JzW2luZGV4XSA9IGluZm87XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5sb2FkZXIobGluaywgb25FbmQuYmluZCh0aGlzLCBvbkxvYWQpLCBvbkVuZC5iaW5kKHRoaXMsIG9uRXJyb3IpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgdGhpcy5sb2FkID0gdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2sgOiBmdW5jdGlvbigpIHt9O1xyXG4gIH1cclxuXHJcbn07XHJcblxyXG5yZXR1cm4ge1xyXG4gIGltYWdlczogbmV3IFN0b3JhZ2UoZnVuY3Rpb24obGluaywgb25TdWNjZXNzLCBvbkZhaWwpIHtcclxuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgIGltZy5zcmMgPSBsaW5rO1xyXG4gICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyBvblN1Y2Nlc3MoaW1nKTsgfTtcclxuICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24oKSB7IG9uRmFpbChsaW5rKTsgfTtcclxuICB9KVxyXG59O1xyXG5cclxufSkoKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
