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
          self.importScripts(baseUrl + '/require.js');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC93b3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUVBLE9BQU87QUFBQSxTQUNMLFNBQVMsTUFBVCxHQUFrQjtBQUNoQixTQUFLLFNBQUwsR0FBa0IsWUFBTTtBQUN0QixVQUFJLGNBQUo7QUFDQSxVQUFJLGFBQUo7O0FBRUEsZUFBUyxhQUFULENBQXVCLENBQXZCLEVBQTBCO0FBQ3hCLFlBQU0sY0FBYyxLQUFLLEdBQUwsRUFBcEI7QUFDQSxZQUFNLFFBQVEsRUFBZDtBQUNBLFlBQUksRUFBRSxJQUFGLENBQU8sSUFBWCxFQUFpQjtBQUNmLGdCQUFNLE9BQU4sR0FBZ0IsQ0FBQyxDQUFDLE1BQU0sUUFBTixDQUFlLEVBQUUsSUFBRixDQUFPLElBQVAsQ0FBWSxHQUEzQixFQUFnQyxFQUFFLElBQUYsQ0FBTyxJQUFQLENBQVksR0FBNUMsQ0FBbEI7QUFDQSxnQkFBTSxRQUFOLEdBQWlCLE1BQU0sUUFBdkI7QUFDQSxnQkFBTSxJQUFOLEdBQWEsTUFBTSxPQUFOLEVBQWI7QUFDQSxnQkFBTSxHQUFOLEdBQVksTUFBTSxLQUFsQjtBQUNBLGdCQUFNLFNBQU4sR0FBa0IsTUFBTSxHQUFOLElBQWEsTUFBTSxJQUFOLENBQVcsSUFBWCxDQUFnQjtBQUFBLG1CQUFPLEdBQVA7QUFBQSxXQUFoQixDQUEvQjtBQUNEO0FBQ0QsWUFBSSxFQUFFLElBQUYsQ0FBTyxFQUFYLEVBQWUsTUFBTSxNQUFOLEdBQWUsS0FBSyxJQUFMLENBQVUsTUFBTSxhQUFoQixDQUFmO0FBQ2YsY0FBTSxNQUFOLEdBQWUsTUFBTSxhQUFyQjtBQUNBLGNBQU0sT0FBTixHQUFnQixLQUFLLEdBQUwsS0FBYSxXQUE3QjtBQUNBLGFBQUssV0FBTCxDQUFpQixLQUFqQjtBQUNBLFlBQUksTUFBTSxTQUFWLEVBQXFCO0FBQ3RCOztBQUVELGVBQVMsYUFBVCxPQUFtQyxLQUFuQyxFQUEwQztBQUFBLFlBQWpCLE1BQWlCLFFBQWpCLE1BQWlCOztBQUN4QyxlQUFPLE1BQVA7QUFDQSxnQkFBUSxJQUFJLEtBQUosRUFBUjtBQUNEOztBQUVELGFBQU8sU0FBUyxJQUFULENBQWMsQ0FBZCxFQUFpQjtBQUN0QixZQUFJO0FBQ0YsY0FBTSxVQUFVLEVBQUUsSUFBRixDQUFPLElBQVAsR0FBYyxFQUFFLElBQUYsQ0FBTyxJQUFQLENBQVksT0FBMUM7QUFDQSxlQUFLLGFBQUwsQ0FBc0IsT0FBdEI7QUFDQSxrQkFBUSxNQUFSLENBQWUsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixFQUFFLElBQUYsQ0FBTyxJQUF6QixFQUErQixFQUFFLGdCQUFGLEVBQS9CLENBQWY7QUFDQSxrQkFBUSxDQUFDLGVBQUQsRUFBa0IsV0FBbEIsQ0FBUixFQUF3QyxZQUFhO0FBQ25EO0FBQ0EsaUJBQUssU0FBTCxHQUFpQixhQUFqQjtBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsRUFBRSxNQUFNLElBQVIsRUFBakI7QUFDRCxXQUpEO0FBS0QsU0FURCxDQVNFLE9BQU8sR0FBUCxFQUFZO0FBQ1osZUFBSyxXQUFMLENBQWlCLEVBQUUsTUFBTSxLQUFSLEVBQWUsY0FBYyxJQUFJLE9BQWpDLEVBQWpCO0FBQ0Q7QUFDRixPQWJEO0FBY0QsS0F4Q2dCLEVBQWpCO0FBeUNELEdBM0NJO0FBQUEsQ0FBUCIsImZpbGUiOiJqcy9hcHAvd29ya2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETyBSZWZhY3RvciBoYW5kbGVNZXNzYWdlIGZ1bmN0aW9uXHJcbi8vIFdvcmtlciBzY3JpcHQgZm9yIGFpIGNvbXB1dGluZ1xyXG5kZWZpbmUoKCkgPT5cclxuICBmdW5jdGlvbiB3b3JrZXIoKSB7XHJcbiAgICBzZWxmLm9ubWVzc2FnZSA9ICgoKSA9PiB7XHJcbiAgICAgIGxldCBzdGF0ZTtcclxuICAgICAgbGV0IHJhbmQ7XHJcblxyXG4gICAgICBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKGUpIHtcclxuICAgICAgICBjb25zdCBhaVN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgY29uc3QgcmVwbHkgPSB7fTtcclxuICAgICAgICBpZiAoZS5kYXRhLm1vdmUpIHtcclxuICAgICAgICAgIHJlcGx5LnN1Y2Nlc3MgPSAhIXN0YXRlLm1ha2VNb3ZlKGUuZGF0YS5tb3ZlLnJvdywgZS5kYXRhLm1vdmUuY29sKTtcclxuICAgICAgICAgIHJlcGx5Lmxhc3RNb3ZlID0gc3RhdGUubGFzdE1vdmU7XHJcbiAgICAgICAgICByZXBseS53aW5zID0gc3RhdGUuZmluZFdpbigpO1xyXG4gICAgICAgICAgcmVwbHkudGllID0gc3RhdGUuaXNUaWU7XHJcbiAgICAgICAgICByZXBseS50ZXJtaW5hdGUgPSByZXBseS50aWUgfHwgcmVwbHkud2lucy5zb21lKHZhbCA9PiB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZS5kYXRhLmFpKSByZXBseS5haU1vdmUgPSByYW5kLml0ZW0oc3RhdGUubmV4dEJlc3RNb3Zlcyk7XHJcbiAgICAgICAgcmVwbHkucGxheWVyID0gc3RhdGUuY3VycmVudFBsYXllcjtcclxuICAgICAgICByZXBseS5haVNwZWVkID0gRGF0ZS5ub3coKSAtIGFpU3RhcnRUaW1lO1xyXG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UocmVwbHkpO1xyXG4gICAgICAgIGlmIChyZXBseS50ZXJtaW5hdGUpIGNsb3NlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGFzc2lnbkdsb2JhbHMoeyByYW5kb20gfSwgU3RhdGUpIHtcclxuICAgICAgICByYW5kID0gcmFuZG9tO1xyXG4gICAgICAgIHN0YXRlID0gbmV3IFN0YXRlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiBpbml0KGUpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgYmFzZVVybCA9IGUuZGF0YS5ocmVmICsgZS5kYXRhLmFyZ3MuYmFzZVVybDtcclxuICAgICAgICAgIHNlbGYuaW1wb3J0U2NyaXB0cyhgJHtiYXNlVXJsfS9yZXF1aXJlLmpzYCk7XHJcbiAgICAgICAgICByZXF1aXJlLmNvbmZpZyhPYmplY3QuYXNzaWduKHt9LCBlLmRhdGEuYXJncywgeyBiYXNlVXJsIH0pKTtcclxuICAgICAgICAgIHJlcXVpcmUoWydhcHAvdXRpbGl0aWVzJywgJ2FwcC9zdGF0ZSddLCAoLi4uYXJncykgPT4ge1xyXG4gICAgICAgICAgICBhc3NpZ25HbG9iYWxzKC4uLmFyZ3MpO1xyXG4gICAgICAgICAgICBzZWxmLm9ubWVzc2FnZSA9IGhhbmRsZU1lc3NhZ2U7XHJcbiAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBpbml0OiB0cnVlIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgaW5pdDogZmFsc2UsIGVycm9yTWVzc2FnZTogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfSkoKTtcclxuICB9XHJcbik7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
