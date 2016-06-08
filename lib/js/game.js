'use strict';

// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
// TODO Add some idle time for drawning field
// TODO Maybe Field and Canvas should not be made here
// TODO Maybe partsToLoad should be dynamic or private number
// TODO Many values should be in config
// Game main presenter
TRIPLET.Game = function () {

  var cfg = TRIPLET.config,
      assets = TRIPLET.assets,
      html = TRIPLET.html,
      worker = TRIPLET.worker,
      ufn = TRIPLET.utilities.function,
      Field = TRIPLET.Field,
      State = TRIPLET.State,
      Picture = TRIPLET.Picture,
      Game;

  Game = function Game(id) {

    var self = this,
        partsToLoad = 3;
    this.userTurn = false;

    function startGame() {
      if (--partsToLoad) return;
      self.picture.drawField();
      self.canvas.addEventListener('click', self.onClick.bind(self));
      self.action();
    }

    assets.images.load(cfg.assets.images, startGame);
    this.state = ufn.makeWorker({
      code: worker,
      onload: startGame,
      handler: this.respond.bind(this),
      importFrom: document.location.href.replace(/[^\/]*$/, '') + 'js' + '/'
    });

    this.field = new Field();
    this.canvas = html.makeCanvas('triplet-' + id, cfg.general.left + cfg.general.right + this.field.width, cfg.general.top + cfg.general.bottom + this.field.height, document.getElementsByTagName('body')[0]);
    this.picture = new Picture(this.field, this.canvas);

    startGame();
  };

  Game.prototype = {

    constructor: Game,

    onClick: function onClick(event) {
      var coords = html.getClickCoords(event);
      if (this.userTurn) {
        this.userTurn = false;
        this.tryMove(this.field.getCellPosition(coords.x, coords.y));
      } else {
        console.log('Please wait for your turn.');
      }
    },

    respond: function respond(message) {
      console.log('time: ' + message.data.aiSpeed);
      if (message.data.bestMove) {
        this.tryMove(message.data.bestMove);
        console.log('minimax score: ' + message.data.bestMove.score[0]);
      } else this.action(message.data);
    },

    tryMove: function tryMove(cell) {
      this.state.postMessage({ move: cell });
    },

    action: function action(result) {
      if (result) {
        if (result.success) this.picture.drawSign(result.lastMove.row, result.lastMove.col, result.lastMove.player);
        if (result.player.isUser) {
          this.userTurn = true;
          console.log('User turn.');
        } else if (result.bestMove !== null) {
          this.state.postMessage({ advice: true });
        } else {
          this.state.terminate();
          throw new Error('Worker failed and was terminated. Restart app.');
        }
      } else {
        this.state.postMessage(0);
      }
    }

  };

  return Game;
}();
//# sourceMappingURL=data:application/json;base64,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TixLQXJCYzs7QUF1QmYsYUFBUyxpQkFBUyxJQUFULEVBQWU7QUFDdEIsV0FBSyxLQUFMLENBQVcsV0FBWCxDQUF1QixFQUFFLE1BQU0sSUFBUixFQUF2QjtBQUNELEtBekJjOztBQTJCZixZQUFRLGdCQUFTLE1BQVQsRUFBaUI7QUFDdkIsVUFBSSxNQUFKLEVBQVk7QUFDVixZQUFJLE9BQU8sT0FBWCxFQUNFLEtBQUssT0FBTCxDQUFhLFFBQWIsQ0FBc0IsT0FBTyxRQUFQLENBQWdCLEdBQXRDLEVBQTJDLE9BQU8sUUFBUCxDQUFnQixHQUEzRCxFQUNzQixPQUFPLFFBQVAsQ0FBZ0IsTUFEdEM7QUFFRixZQUFJLE9BQU8sTUFBUCxDQUFjLE1BQWxCLEVBQTBCO0FBQ3hCLGVBQUssUUFBTCxHQUFnQixJQUFoQjtBQUNBLGtCQUFRLEdBQVIsQ0FBWSxZQUFaO0FBQ0QsU0FIRCxNQUdPLElBQUksT0FBTyxRQUFQLEtBQW9CLElBQXhCLEVBQThCO0FBQ25DLGVBQUssS0FBTCxDQUFXLFdBQVgsQ0FBdUIsRUFBRSxRQUFRLElBQVYsRUFBdkI7QUFDRCxTQUZNLE1BRUE7QUFDTCxlQUFLLEtBQUwsQ0FBVyxTQUFYO0FBQ0EsZ0JBQU0sSUFBSSxLQUFKLENBQVUsZ0RBQVYsQ0FBTjtBQUNEO0FBQ0YsT0FiRCxNQWFPO0FBQ0wsYUFBSyxLQUFMLENBQVcsV0FBWCxDQUF1QixDQUF2QjtBQUNEO0FBQ0Y7O0FBNUNjLEdBQWpCOztBQWdEQSxTQUFPLElBQVA7QUFFQyxDQS9GYyxFQUFmIiwiZmlsZSI6ImpzL2dhbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIE1ha2luZyBjYW52YXMgYW5kIHdvcmtlciBpcyBub3QgaW4gY29uZmlnXHJcbi8vIFRPRE8gQWRkIHRpbWluZ3MgaW4gYWN0aW9uXHJcbi8vIFRPRE8gQXNrIHVzZXIgdG8gd2FpdCBvciB0ZXJtaW5hdGUgaWYgdXNlciBjbGlja3Mgd2hpbGUgQUkgd29ya2luZ1xyXG4vLyBUT0RPIEFzayB1c2VyIHRvIG1ha2UgdHVybiB3aXRob3V0IGNvbnNvbGVcclxuLy8gVE9ETyBBZGQgc29tZSBpZGxlIHRpbWUgZm9yIGRyYXduaW5nIGZpZWxkXHJcbi8vIFRPRE8gTWF5YmUgRmllbGQgYW5kIENhbnZhcyBzaG91bGQgbm90IGJlIG1hZGUgaGVyZVxyXG4vLyBUT0RPIE1heWJlIHBhcnRzVG9Mb2FkIHNob3VsZCBiZSBkeW5hbWljIG9yIHByaXZhdGUgbnVtYmVyXHJcbi8vIFRPRE8gTWFueSB2YWx1ZXMgc2hvdWxkIGJlIGluIGNvbmZpZ1xyXG4vLyBHYW1lIG1haW4gcHJlc2VudGVyXHJcblRSSVBMRVQuR2FtZSA9IChmdW5jdGlvbigpIHtcclxuXHJcbnZhciBjZmcgPSBUUklQTEVULmNvbmZpZyxcclxuICAgIGFzc2V0cyA9IFRSSVBMRVQuYXNzZXRzLFxyXG4gICAgaHRtbCA9IFRSSVBMRVQuaHRtbCxcclxuICAgIHdvcmtlciA9IFRSSVBMRVQud29ya2VyLFxyXG4gICAgdWZuID0gVFJJUExFVC51dGlsaXRpZXMuZnVuY3Rpb24sXHJcbiAgICBGaWVsZCA9IFRSSVBMRVQuRmllbGQsXHJcbiAgICBTdGF0ZSA9IFRSSVBMRVQuU3RhdGUsXHJcbiAgICBQaWN0dXJlID0gVFJJUExFVC5QaWN0dXJlLFxyXG4gICAgR2FtZTtcclxuXHJcbkdhbWUgPSBmdW5jdGlvbihpZCkge1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgIHBhcnRzVG9Mb2FkID0gMztcclxuICB0aGlzLnVzZXJUdXJuID0gZmFsc2U7XHJcblxyXG4gIGZ1bmN0aW9uIHN0YXJ0R2FtZSgpIHtcclxuICAgIGlmICgtLXBhcnRzVG9Mb2FkKSByZXR1cm47XHJcbiAgICBzZWxmLnBpY3R1cmUuZHJhd0ZpZWxkKCk7XHJcbiAgICBzZWxmLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25DbGljay5iaW5kKHNlbGYpKTtcclxuICAgIHNlbGYuYWN0aW9uKCk7XHJcbiAgfVxyXG5cclxuICBhc3NldHMuaW1hZ2VzLmxvYWQoY2ZnLmFzc2V0cy5pbWFnZXMsIHN0YXJ0R2FtZSk7XHJcbiAgdGhpcy5zdGF0ZSA9IHVmbi5tYWtlV29ya2VyKHtcclxuICAgIGNvZGU6IHdvcmtlcixcclxuICAgIG9ubG9hZDogc3RhcnRHYW1lLFxyXG4gICAgaGFuZGxlcjogdGhpcy5yZXNwb25kLmJpbmQodGhpcyksXHJcbiAgICBpbXBvcnRGcm9tOiBkb2N1bWVudC5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1teXFwvXSokLywgJycpICsgJ2pzJyArICcvJ1xyXG4gIH0pO1xyXG5cclxuICB0aGlzLmZpZWxkID0gbmV3IEZpZWxkKCk7XHJcbiAgdGhpcy5jYW52YXMgPSBodG1sLm1ha2VDYW52YXMoXHJcbiAgICAgICd0cmlwbGV0LScgKyBpZCxcclxuICAgICAgY2ZnLmdlbmVyYWwubGVmdCArIGNmZy5nZW5lcmFsLnJpZ2h0ICsgdGhpcy5maWVsZC53aWR0aCxcclxuICAgICAgY2ZnLmdlbmVyYWwudG9wICsgY2ZnLmdlbmVyYWwuYm90dG9tICsgdGhpcy5maWVsZC5oZWlnaHQsXHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0pO1xyXG4gIHRoaXMucGljdHVyZSA9IG5ldyBQaWN0dXJlKHRoaXMuZmllbGQsIHRoaXMuY2FudmFzKTtcclxuXHJcbiAgc3RhcnRHYW1lKCk7XHJcblxyXG59O1xyXG5cclxuR2FtZS5wcm90b3R5cGUgPSB7XHJcblxyXG4gIGNvbnN0cnVjdG9yOiBHYW1lLFxyXG5cclxuICBvbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgdmFyIGNvb3JkcyA9IGh0bWwuZ2V0Q2xpY2tDb29yZHMoZXZlbnQpO1xyXG4gICAgaWYgKHRoaXMudXNlclR1cm4pIHtcclxuICAgICAgdGhpcy51c2VyVHVybiA9IGZhbHNlO1xyXG4gICAgICB0aGlzLnRyeU1vdmUodGhpcy5maWVsZC5nZXRDZWxsUG9zaXRpb24oY29vcmRzLngsIGNvb3Jkcy55KSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZygnUGxlYXNlIHdhaXQgZm9yIHlvdXIgdHVybi4nKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICByZXNwb25kOiBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBjb25zb2xlLmxvZygndGltZTogJyArIG1lc3NhZ2UuZGF0YS5haVNwZWVkKTtcclxuICAgIGlmIChtZXNzYWdlLmRhdGEuYmVzdE1vdmUpIHtcclxuICAgICAgdGhpcy50cnlNb3ZlKG1lc3NhZ2UuZGF0YS5iZXN0TW92ZSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdtaW5pbWF4IHNjb3JlOiAnICsgbWVzc2FnZS5kYXRhLmJlc3RNb3ZlLnNjb3JlWzBdKTtcclxuICAgIH1cclxuICAgIGVsc2UgdGhpcy5hY3Rpb24obWVzc2FnZS5kYXRhKTtcclxuICB9LFxyXG5cclxuICB0cnlNb3ZlOiBmdW5jdGlvbihjZWxsKSB7XHJcbiAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKHsgbW92ZTogY2VsbCB9KTtcclxuICB9LFxyXG5cclxuICBhY3Rpb246IGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXHJcbiAgICAgICAgdGhpcy5waWN0dXJlLmRyYXdTaWduKHJlc3VsdC5sYXN0TW92ZS5yb3csIHJlc3VsdC5sYXN0TW92ZS5jb2wsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5sYXN0TW92ZS5wbGF5ZXIpO1xyXG4gICAgICBpZiAocmVzdWx0LnBsYXllci5pc1VzZXIpIHtcclxuICAgICAgICB0aGlzLnVzZXJUdXJuID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciB0dXJuLicpO1xyXG4gICAgICB9IGVsc2UgaWYgKHJlc3VsdC5iZXN0TW92ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuc3RhdGUucG9zdE1lc3NhZ2UoeyBhZHZpY2U6IHRydWUgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zdGF0ZS50ZXJtaW5hdGUoKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dvcmtlciBmYWlsZWQgYW5kIHdhcyB0ZXJtaW5hdGVkLiBSZXN0YXJ0IGFwcC4nKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zdGF0ZS5wb3N0TWVzc2FnZSgwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59O1xyXG5cclxucmV0dXJuIEdhbWU7XHJcblxyXG59KSgpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
