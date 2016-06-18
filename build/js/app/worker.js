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
        if (e.data.ai) reply.aiMove = rand.item(state.nextBestMoves) || null;
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
          var baseUrl = e.data.href + e.data.amdCfg.baseUrl;
          self.importScripts(baseUrl + '/require.js');
          require.config(Object.assign({}, e.data.amdCfg, { baseUrl: baseUrl }));
          require(['app/utilities', 'app/state'], function () {
            assignGlobals.apply(undefined, arguments);
            self.onmessage = handleMessage;
            self.postMessage({ init: true });
          });
        } catch (err) {
          self.postMessage({ init: false, error: err.message });
        }
      };
    }();
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC93b3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUVBLE9BQU87QUFBQSxTQUNMLFNBQVMsTUFBVCxHQUFrQjtBQUNoQixTQUFLLFNBQUwsR0FBa0IsWUFBTTtBQUN0QixVQUFJLGNBQUo7QUFDQSxVQUFJLGFBQUo7O0FBRUEsZUFBUyxhQUFULENBQXVCLENBQXZCLEVBQTBCO0FBQ3hCLFlBQU0sY0FBYyxLQUFLLEdBQUwsRUFBcEI7QUFDQSxZQUFNLFFBQVEsRUFBZDtBQUNBLFlBQUksRUFBRSxJQUFGLENBQU8sSUFBWCxFQUFpQjtBQUNmLGdCQUFNLE9BQU4sR0FBZ0IsQ0FBQyxDQUFDLE1BQU0sUUFBTixDQUFlLEVBQUUsSUFBRixDQUFPLElBQVAsQ0FBWSxHQUEzQixFQUFnQyxFQUFFLElBQUYsQ0FBTyxJQUFQLENBQVksR0FBNUMsQ0FBbEI7QUFDQSxnQkFBTSxRQUFOLEdBQWlCLE1BQU0sUUFBdkI7QUFDQSxnQkFBTSxJQUFOLEdBQWEsTUFBTSxPQUFOLEVBQWI7QUFDQSxnQkFBTSxHQUFOLEdBQVksTUFBTSxLQUFsQjtBQUNBLGdCQUFNLFNBQU4sR0FBa0IsTUFBTSxHQUFOLElBQWEsTUFBTSxJQUFOLENBQVcsSUFBWCxDQUFnQjtBQUFBLG1CQUFPLEdBQVA7QUFBQSxXQUFoQixDQUEvQjtBQUNEO0FBQ0QsWUFBSSxFQUFFLElBQUYsQ0FBTyxFQUFYLEVBQWUsTUFBTSxNQUFOLEdBQWUsS0FBSyxJQUFMLENBQVUsTUFBTSxhQUFoQixLQUFrQyxJQUFqRDtBQUNmLGNBQU0sTUFBTixHQUFlLE1BQU0sYUFBckI7QUFDQSxjQUFNLE9BQU4sR0FBZ0IsS0FBSyxHQUFMLEtBQWEsV0FBN0I7QUFDQSxhQUFLLFdBQUwsQ0FBaUIsS0FBakI7QUFDQSxZQUFJLE1BQU0sU0FBVixFQUFxQjtBQUN0Qjs7QUFFRCxlQUFTLGFBQVQsT0FBbUMsS0FBbkMsRUFBMEM7QUFBQSxZQUFqQixNQUFpQixRQUFqQixNQUFpQjs7QUFDeEMsZUFBTyxNQUFQO0FBQ0EsZ0JBQVEsSUFBSSxLQUFKLEVBQVI7QUFDRDs7QUFFRCxhQUFPLFNBQVMsSUFBVCxDQUFjLENBQWQsRUFBaUI7QUFDdEIsWUFBSTtBQUNGLGNBQU0sVUFBVSxFQUFFLElBQUYsQ0FBTyxJQUFQLEdBQWMsRUFBRSxJQUFGLENBQU8sTUFBUCxDQUFjLE9BQTVDO0FBQ0EsZUFBSyxhQUFMLENBQXNCLE9BQXRCO0FBQ0Esa0JBQVEsTUFBUixDQUFlLE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0IsRUFBRSxJQUFGLENBQU8sTUFBekIsRUFBaUMsRUFBRSxnQkFBRixFQUFqQyxDQUFmO0FBQ0Esa0JBQVEsQ0FBQyxlQUFELEVBQWtCLFdBQWxCLENBQVIsRUFBd0MsWUFBYTtBQUNuRDtBQUNBLGlCQUFLLFNBQUwsR0FBaUIsYUFBakI7QUFDQSxpQkFBSyxXQUFMLENBQWlCLEVBQUUsTUFBTSxJQUFSLEVBQWpCO0FBQ0QsV0FKRDtBQUtELFNBVEQsQ0FTRSxPQUFPLEdBQVAsRUFBWTtBQUNaLGVBQUssV0FBTCxDQUFpQixFQUFFLE1BQU0sS0FBUixFQUFlLE9BQU8sSUFBSSxPQUExQixFQUFqQjtBQUNEO0FBQ0YsT0FiRDtBQWNELEtBeENnQixFQUFqQjtBQXlDRCxHQTNDSTtBQUFBLENBQVAiLCJmaWxlIjoianMvYXBwL3dvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gUmVmYWN0b3IgaGFuZGxlTWVzc2FnZSBmdW5jdGlvblxyXG4vLyBXb3JrZXIgc2NyaXB0IGZvciBhaSBjb21wdXRpbmdcclxuZGVmaW5lKCgpID0+XHJcbiAgZnVuY3Rpb24gd29ya2VyKCkge1xyXG4gICAgc2VsZi5vbm1lc3NhZ2UgPSAoKCkgPT4ge1xyXG4gICAgICBsZXQgc3RhdGU7XHJcbiAgICAgIGxldCByYW5kO1xyXG5cclxuICAgICAgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShlKSB7XHJcbiAgICAgICAgY29uc3QgYWlTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGNvbnN0IHJlcGx5ID0ge307XHJcbiAgICAgICAgaWYgKGUuZGF0YS5tb3ZlKSB7XHJcbiAgICAgICAgICByZXBseS5zdWNjZXNzID0gISFzdGF0ZS5tYWtlTW92ZShlLmRhdGEubW92ZS5yb3csIGUuZGF0YS5tb3ZlLmNvbCk7XHJcbiAgICAgICAgICByZXBseS5sYXN0TW92ZSA9IHN0YXRlLmxhc3RNb3ZlO1xyXG4gICAgICAgICAgcmVwbHkud2lucyA9IHN0YXRlLmZpbmRXaW4oKTtcclxuICAgICAgICAgIHJlcGx5LnRpZSA9IHN0YXRlLmlzVGllO1xyXG4gICAgICAgICAgcmVwbHkudGVybWluYXRlID0gcmVwbHkudGllIHx8IHJlcGx5LndpbnMuc29tZSh2YWwgPT4gdmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGUuZGF0YS5haSkgcmVwbHkuYWlNb3ZlID0gcmFuZC5pdGVtKHN0YXRlLm5leHRCZXN0TW92ZXMpIHx8IG51bGw7XHJcbiAgICAgICAgcmVwbHkucGxheWVyID0gc3RhdGUuY3VycmVudFBsYXllcjtcclxuICAgICAgICByZXBseS5haVNwZWVkID0gRGF0ZS5ub3coKSAtIGFpU3RhcnRUaW1lO1xyXG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UocmVwbHkpO1xyXG4gICAgICAgIGlmIChyZXBseS50ZXJtaW5hdGUpIGNsb3NlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGFzc2lnbkdsb2JhbHMoeyByYW5kb20gfSwgU3RhdGUpIHtcclxuICAgICAgICByYW5kID0gcmFuZG9tO1xyXG4gICAgICAgIHN0YXRlID0gbmV3IFN0YXRlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiBpbml0KGUpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgYmFzZVVybCA9IGUuZGF0YS5ocmVmICsgZS5kYXRhLmFtZENmZy5iYXNlVXJsO1xyXG4gICAgICAgICAgc2VsZi5pbXBvcnRTY3JpcHRzKGAke2Jhc2VVcmx9L3JlcXVpcmUuanNgKTtcclxuICAgICAgICAgIHJlcXVpcmUuY29uZmlnKE9iamVjdC5hc3NpZ24oe30sIGUuZGF0YS5hbWRDZmcsIHsgYmFzZVVybCB9KSk7XHJcbiAgICAgICAgICByZXF1aXJlKFsnYXBwL3V0aWxpdGllcycsICdhcHAvc3RhdGUnXSwgKC4uLmFyZ3MpID0+IHtcclxuICAgICAgICAgICAgYXNzaWduR2xvYmFscyguLi5hcmdzKTtcclxuICAgICAgICAgICAgc2VsZi5vbm1lc3NhZ2UgPSBoYW5kbGVNZXNzYWdlO1xyXG4gICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgaW5pdDogdHJ1ZSB9KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGluaXQ6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfSkoKTtcclxuICB9XHJcbik7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
