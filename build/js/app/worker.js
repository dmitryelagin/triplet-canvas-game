"use strict";

// TODO Refactor handleMessage function
// TODO Later delete TRIPLET object making from here
// Worker script for ai computing
define(function () {
  return function worker() {
    self.onmessage = function () {
      var state = void 0;
      var random = void 0;

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
        if (e.data.ai) reply.aiMove = random.item(state.nextBestMoves) || null;
        reply.player = state.currentPlayer;
        reply.aiSpeed = Date.now() - aiStartTime;
        self.postMessage(reply);
        if (reply.terminate) close();
      }

      function initialize(href) {
        self.importScripts(href + "../lib/require.js");
        random = require(href + "utilities.js").random;
        var State = require(href + "state.js");
        state = new State();
      }

      function init(e) {
        try {
          initialize(e.data.href);
          self.onmessage = handleMessage;
          self.postMessage({ init: true });
        } catch (err) {
          self.postMessage({ init: false, error: err.message });
        }
      }

      return init;
    }();
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC93b3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFHQSxPQUFPO0FBQUEsU0FDTCxTQUFTLE1BQVQsR0FBa0I7QUFDaEIsU0FBSyxTQUFMLEdBQWtCLFlBQU07QUFDdEIsVUFBSSxjQUFKO0FBQ0EsVUFBSSxlQUFKOztBQUVBLGVBQVMsYUFBVCxDQUF1QixDQUF2QixFQUEwQjtBQUN4QixZQUFNLGNBQWMsS0FBSyxHQUFMLEVBQXBCO0FBQ0EsWUFBTSxRQUFRLEVBQWQ7QUFDQSxZQUFJLEVBQUUsSUFBRixDQUFPLElBQVgsRUFBaUI7QUFDZixnQkFBTSxPQUFOLEdBQWdCLENBQUMsQ0FBQyxNQUFNLFFBQU4sQ0FBZSxFQUFFLElBQUYsQ0FBTyxJQUFQLENBQVksR0FBM0IsRUFBZ0MsRUFBRSxJQUFGLENBQU8sSUFBUCxDQUFZLEdBQTVDLENBQWxCO0FBQ0EsZ0JBQU0sUUFBTixHQUFpQixNQUFNLFFBQXZCO0FBQ0EsZ0JBQU0sSUFBTixHQUFhLE1BQU0sT0FBTixFQUFiO0FBQ0EsZ0JBQU0sR0FBTixHQUFZLE1BQU0sS0FBbEI7QUFDQSxnQkFBTSxTQUFOLEdBQWtCLE1BQU0sR0FBTixJQUFhLE1BQU0sSUFBTixDQUFXLElBQVgsQ0FBZ0I7QUFBQSxtQkFBTyxHQUFQO0FBQUEsV0FBaEIsQ0FBL0I7QUFDRDtBQUNELFlBQUksRUFBRSxJQUFGLENBQU8sRUFBWCxFQUFlLE1BQU0sTUFBTixHQUFlLE9BQU8sSUFBUCxDQUFZLE1BQU0sYUFBbEIsS0FBb0MsSUFBbkQ7QUFDZixjQUFNLE1BQU4sR0FBZSxNQUFNLGFBQXJCO0FBQ0EsY0FBTSxPQUFOLEdBQWdCLEtBQUssR0FBTCxLQUFhLFdBQTdCO0FBQ0EsYUFBSyxXQUFMLENBQWlCLEtBQWpCO0FBQ0EsWUFBSSxNQUFNLFNBQVYsRUFBcUI7QUFDdEI7O0FBRUQsZUFBUyxVQUFULENBQW9CLElBQXBCLEVBQTBCO0FBQ3hCLGFBQUssYUFBTCxDQUFzQixJQUF0QjtBQUNBLGlCQUFTLFFBQVcsSUFBWCxtQkFBK0IsTUFBeEM7QUFDQSxZQUFNLFFBQVEsUUFBVyxJQUFYLGNBQWQ7QUFDQSxnQkFBUSxJQUFJLEtBQUosRUFBUjtBQUNEOztBQUVELGVBQVMsSUFBVCxDQUFjLENBQWQsRUFBaUI7QUFDZixZQUFJO0FBQ0YscUJBQVcsRUFBRSxJQUFGLENBQU8sSUFBbEI7QUFDQSxlQUFLLFNBQUwsR0FBaUIsYUFBakI7QUFDQSxlQUFLLFdBQUwsQ0FBaUIsRUFBRSxNQUFNLElBQVIsRUFBakI7QUFDRCxTQUpELENBSUUsT0FBTyxHQUFQLEVBQVk7QUFDWixlQUFLLFdBQUwsQ0FBaUIsRUFBRSxNQUFNLEtBQVIsRUFBZSxPQUFPLElBQUksT0FBMUIsRUFBakI7QUFDRDtBQUNGOztBQUVELGFBQU8sSUFBUDtBQUNELEtBdkNnQixFQUFqQjtBQXdDRCxHQTFDSTtBQUFBLENBQVAiLCJmaWxlIjoianMvYXBwL3dvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gUmVmYWN0b3IgaGFuZGxlTWVzc2FnZSBmdW5jdGlvblxyXG4vLyBUT0RPIExhdGVyIGRlbGV0ZSBUUklQTEVUIG9iamVjdCBtYWtpbmcgZnJvbSBoZXJlXHJcbi8vIFdvcmtlciBzY3JpcHQgZm9yIGFpIGNvbXB1dGluZ1xyXG5kZWZpbmUoKCkgPT5cclxuICBmdW5jdGlvbiB3b3JrZXIoKSB7XHJcbiAgICBzZWxmLm9ubWVzc2FnZSA9ICgoKSA9PiB7XHJcbiAgICAgIGxldCBzdGF0ZTtcclxuICAgICAgbGV0IHJhbmRvbTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZSkge1xyXG4gICAgICAgIGNvbnN0IGFpU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICBjb25zdCByZXBseSA9IHt9O1xyXG4gICAgICAgIGlmIChlLmRhdGEubW92ZSkge1xyXG4gICAgICAgICAgcmVwbHkuc3VjY2VzcyA9ICEhc3RhdGUubWFrZU1vdmUoZS5kYXRhLm1vdmUucm93LCBlLmRhdGEubW92ZS5jb2wpO1xyXG4gICAgICAgICAgcmVwbHkubGFzdE1vdmUgPSBzdGF0ZS5sYXN0TW92ZTtcclxuICAgICAgICAgIHJlcGx5LndpbnMgPSBzdGF0ZS5maW5kV2luKCk7XHJcbiAgICAgICAgICByZXBseS50aWUgPSBzdGF0ZS5pc1RpZTtcclxuICAgICAgICAgIHJlcGx5LnRlcm1pbmF0ZSA9IHJlcGx5LnRpZSB8fCByZXBseS53aW5zLnNvbWUodmFsID0+IHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChlLmRhdGEuYWkpIHJlcGx5LmFpTW92ZSA9IHJhbmRvbS5pdGVtKHN0YXRlLm5leHRCZXN0TW92ZXMpIHx8IG51bGw7XHJcbiAgICAgICAgcmVwbHkucGxheWVyID0gc3RhdGUuY3VycmVudFBsYXllcjtcclxuICAgICAgICByZXBseS5haVNwZWVkID0gRGF0ZS5ub3coKSAtIGFpU3RhcnRUaW1lO1xyXG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UocmVwbHkpO1xyXG4gICAgICAgIGlmIChyZXBseS50ZXJtaW5hdGUpIGNsb3NlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGluaXRpYWxpemUoaHJlZikge1xyXG4gICAgICAgIHNlbGYuaW1wb3J0U2NyaXB0cyhgJHtocmVmfS4uL2xpYi9yZXF1aXJlLmpzYCk7XHJcbiAgICAgICAgcmFuZG9tID0gcmVxdWlyZShgJHtocmVmfXV0aWxpdGllcy5qc2ApLnJhbmRvbTtcclxuICAgICAgICBjb25zdCBTdGF0ZSA9IHJlcXVpcmUoYCR7aHJlZn1zdGF0ZS5qc2ApO1xyXG4gICAgICAgIHN0YXRlID0gbmV3IFN0YXRlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGluaXQoZSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpbml0aWFsaXplKGUuZGF0YS5ocmVmKTtcclxuICAgICAgICAgIHNlbGYub25tZXNzYWdlID0gaGFuZGxlTWVzc2FnZTtcclxuICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBpbml0OiB0cnVlIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGluaXQ6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gaW5pdDtcclxuICAgIH0pKCk7XHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
