'use strict';

// TODO Refactor handleMessage function
// Worker script for ai computing
define(function () {
  return function worker() {
    self.onmessage = function () {
      var state = void 0;
      var rand = void 0;

      function handleMessage(e) {
        var aiStartTime = Date.now();
        var reply = {};
        if (e.data.move) {
          reply.success = !!state.makeMove(e.data.move.row, e.data.move.col);
          reply.lastMove = state.lastMove;
          reply.wins = state.findWin();
          reply.tie = state.isTie;
          reply.terminate = reply.tie || reply.wins.some(function (val) {
            return val;
          });
        }
        if (e.data.ai) reply.aiMove = rand.item(state.nextBestMoves);
        reply.player = state.currentPlayer;
        reply.aiSpeed = Date.now() - aiStartTime;
        self.postMessage(reply);
        if (reply.terminate) close();
      }

      function assignGlobals(_ref, State) {
        var random = _ref.random;

        rand = random;
        state = new State();
      }

      return function init(e) {
        try {
          var baseUrl = e.data.href + e.data.args.baseUrl;
          self.importScripts(baseUrl + '/polyfill.js', baseUrl + '/require.js');
          require.config(Object.assign({}, e.data.args, { baseUrl: baseUrl }));
          require(['app/utilities', 'app/state'], function () {
            assignGlobals.apply(undefined, arguments);
            self.onmessage = handleMessage;
            self.postMessage({ init: true });
          });
        } catch (err) {
          self.postMessage({ init: false, errorMessage: err.message });
        }
      };
    }();
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC93b3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUVBLE9BQU87QUFBQSxTQUNMLFNBQVMsTUFBVCxHQUFrQjtBQUNoQixTQUFLLFNBQUwsR0FBa0IsWUFBTTtBQUN0QixVQUFJLGNBQUo7QUFDQSxVQUFJLGFBQUo7O0FBRUEsZUFBUyxhQUFULENBQXVCLENBQXZCLEVBQTBCO0FBQ3hCLFlBQU0sY0FBYyxLQUFLLEdBQUwsRUFBcEI7QUFDQSxZQUFNLFFBQVEsRUFBZDtBQUNBLFlBQUksRUFBRSxJQUFGLENBQU8sSUFBWCxFQUFpQjtBQUNmLGdCQUFNLE9BQU4sR0FBZ0IsQ0FBQyxDQUFDLE1BQU0sUUFBTixDQUFlLEVBQUUsSUFBRixDQUFPLElBQVAsQ0FBWSxHQUEzQixFQUFnQyxFQUFFLElBQUYsQ0FBTyxJQUFQLENBQVksR0FBNUMsQ0FBbEI7QUFDQSxnQkFBTSxRQUFOLEdBQWlCLE1BQU0sUUFBdkI7QUFDQSxnQkFBTSxJQUFOLEdBQWEsTUFBTSxPQUFOLEVBQWI7QUFDQSxnQkFBTSxHQUFOLEdBQVksTUFBTSxLQUFsQjtBQUNBLGdCQUFNLFNBQU4sR0FBa0IsTUFBTSxHQUFOLElBQWEsTUFBTSxJQUFOLENBQVcsSUFBWCxDQUFnQjtBQUFBLG1CQUFPLEdBQVA7QUFBQSxXQUFoQixDQUEvQjtBQUNEO0FBQ0QsWUFBSSxFQUFFLElBQUYsQ0FBTyxFQUFYLEVBQWUsTUFBTSxNQUFOLEdBQWUsS0FBSyxJQUFMLENBQVUsTUFBTSxhQUFoQixDQUFmO0FBQ2YsY0FBTSxNQUFOLEdBQWUsTUFBTSxhQUFyQjtBQUNBLGNBQU0sT0FBTixHQUFnQixLQUFLLEdBQUwsS0FBYSxXQUE3QjtBQUNBLGFBQUssV0FBTCxDQUFpQixLQUFqQjtBQUNBLFlBQUksTUFBTSxTQUFWLEVBQXFCO0FBQ3RCOztBQUVELGVBQVMsYUFBVCxPQUFtQyxLQUFuQyxFQUEwQztBQUFBLFlBQWpCLE1BQWlCLFFBQWpCLE1BQWlCOztBQUN4QyxlQUFPLE1BQVA7QUFDQSxnQkFBUSxJQUFJLEtBQUosRUFBUjtBQUNEOztBQUVELGFBQU8sU0FBUyxJQUFULENBQWMsQ0FBZCxFQUFpQjtBQUN0QixZQUFJO0FBQ0YsY0FBTSxVQUFVLEVBQUUsSUFBRixDQUFPLElBQVAsR0FBYyxFQUFFLElBQUYsQ0FBTyxJQUFQLENBQVksT0FBMUM7QUFDQSxlQUFLLGFBQUwsQ0FBc0IsT0FBdEIsbUJBQStDLE9BQS9DO0FBQ0Esa0JBQVEsTUFBUixDQUFlLE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0IsRUFBRSxJQUFGLENBQU8sSUFBekIsRUFBK0IsRUFBRSxnQkFBRixFQUEvQixDQUFmO0FBQ0Esa0JBQVEsQ0FBQyxlQUFELEVBQWtCLFdBQWxCLENBQVIsRUFBd0MsWUFBYTtBQUNuRDtBQUNBLGlCQUFLLFNBQUwsR0FBaUIsYUFBakI7QUFDQSxpQkFBSyxXQUFMLENBQWlCLEVBQUUsTUFBTSxJQUFSLEVBQWpCO0FBQ0QsV0FKRDtBQUtELFNBVEQsQ0FTRSxPQUFPLEdBQVAsRUFBWTtBQUNaLGVBQUssV0FBTCxDQUFpQixFQUFFLE1BQU0sS0FBUixFQUFlLGNBQWMsSUFBSSxPQUFqQyxFQUFqQjtBQUNEO0FBQ0YsT0FiRDtBQWNELEtBeENnQixFQUFqQjtBQXlDRCxHQTNDSTtBQUFBLENBQVAiLCJmaWxlIjoianMvYXBwL3dvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gUmVmYWN0b3IgaGFuZGxlTWVzc2FnZSBmdW5jdGlvblxyXG4vLyBXb3JrZXIgc2NyaXB0IGZvciBhaSBjb21wdXRpbmdcclxuZGVmaW5lKCgpID0+XHJcbiAgZnVuY3Rpb24gd29ya2VyKCkge1xyXG4gICAgc2VsZi5vbm1lc3NhZ2UgPSAoKCkgPT4ge1xyXG4gICAgICBsZXQgc3RhdGU7XHJcbiAgICAgIGxldCByYW5kO1xyXG5cclxuICAgICAgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShlKSB7XHJcbiAgICAgICAgY29uc3QgYWlTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGNvbnN0IHJlcGx5ID0ge307XHJcbiAgICAgICAgaWYgKGUuZGF0YS5tb3ZlKSB7XHJcbiAgICAgICAgICByZXBseS5zdWNjZXNzID0gISFzdGF0ZS5tYWtlTW92ZShlLmRhdGEubW92ZS5yb3csIGUuZGF0YS5tb3ZlLmNvbCk7XHJcbiAgICAgICAgICByZXBseS5sYXN0TW92ZSA9IHN0YXRlLmxhc3RNb3ZlO1xyXG4gICAgICAgICAgcmVwbHkud2lucyA9IHN0YXRlLmZpbmRXaW4oKTtcclxuICAgICAgICAgIHJlcGx5LnRpZSA9IHN0YXRlLmlzVGllO1xyXG4gICAgICAgICAgcmVwbHkudGVybWluYXRlID0gcmVwbHkudGllIHx8IHJlcGx5LndpbnMuc29tZSh2YWwgPT4gdmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGUuZGF0YS5haSkgcmVwbHkuYWlNb3ZlID0gcmFuZC5pdGVtKHN0YXRlLm5leHRCZXN0TW92ZXMpO1xyXG4gICAgICAgIHJlcGx5LnBsYXllciA9IHN0YXRlLmN1cnJlbnRQbGF5ZXI7XHJcbiAgICAgICAgcmVwbHkuYWlTcGVlZCA9IERhdGUubm93KCkgLSBhaVN0YXJ0VGltZTtcclxuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHJlcGx5KTtcclxuICAgICAgICBpZiAocmVwbHkudGVybWluYXRlKSBjbG9zZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBhc3NpZ25HbG9iYWxzKHsgcmFuZG9tIH0sIFN0YXRlKSB7XHJcbiAgICAgICAgcmFuZCA9IHJhbmRvbTtcclxuICAgICAgICBzdGF0ZSA9IG5ldyBTdGF0ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gaW5pdChlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IGJhc2VVcmwgPSBlLmRhdGEuaHJlZiArIGUuZGF0YS5hcmdzLmJhc2VVcmw7XHJcbiAgICAgICAgICBzZWxmLmltcG9ydFNjcmlwdHMoYCR7YmFzZVVybH0vcG9seWZpbGwuanNgLGAke2Jhc2VVcmx9L3JlcXVpcmUuanNgKTtcclxuICAgICAgICAgIHJlcXVpcmUuY29uZmlnKE9iamVjdC5hc3NpZ24oe30sIGUuZGF0YS5hcmdzLCB7IGJhc2VVcmwgfSkpO1xyXG4gICAgICAgICAgcmVxdWlyZShbJ2FwcC91dGlsaXRpZXMnLCAnYXBwL3N0YXRlJ10sICguLi5hcmdzKSA9PiB7XHJcbiAgICAgICAgICAgIGFzc2lnbkdsb2JhbHMoLi4uYXJncyk7XHJcbiAgICAgICAgICAgIHNlbGYub25tZXNzYWdlID0gaGFuZGxlTWVzc2FnZTtcclxuICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGluaXQ6IHRydWUgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBpbml0OiBmYWxzZSwgZXJyb3JNZXNzYWdlOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG4gIH1cclxuKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
