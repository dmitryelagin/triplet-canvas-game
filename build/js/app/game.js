'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
// TODO Add some idle time for drawning field
// TODO Maybe Field and Canvas should not be made here
// TODO Many string values should be in config
// TODO Add end game functionality
// TODO Maybe userTurn flag is not needed
// Game main presenter
define(['./config', './assets', './utilities', './worker', './field', './picture'], function (_ref, _ref2, _ref3, code, Field, Picture) {
  var cfg = _ref.general;
  var links = _ref.assets;
  var images = _ref2.images;
  var worker = _ref3.worker;
  var html = _ref3.html;
  return function () {
    function Game() {
      var _this = this;

      var id = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
      var amdCfg = arguments[1];

      _classCallCheck(this, Game);

      var waitLoad = this.constructor.toString().match(/startGame/g).length - 2;
      var startGame = function startGame() {
        if (--waitLoad) return;
        _this.picture.drawField();
        _this.canvas.addEventListener('click', _this.onClick.bind(_this));
        _this.action();
      };
      this.userTurn = false;

      this.field = new Field();
      this.canvas = html.makeCanvas('triplet-' + id, cfg.left + cfg.right + this.field.width, cfg.top + cfg.bottom + this.field.height, document.getElementsByTagName('body')[0]);
      this.picture = new Picture(this.field, this.canvas);

      images.load(links.images).then(function () {
        return _this.picture.initialize(images.pool);
      }).catch(function () {
        try {
          _this.picture.initialize(images.pool);
        } catch (e) {
          throw new Error('Too many sprites are missed: ' + images.pool);
        }
      }).then(function () {
        return startGame();
      });

      worker.fromFn({
        code: code,
        args: amdCfg,
        handler: this.respond.bind(this),
        href: document.location.href.replace(/[^\/]*$/, '')
      }).then(function (wrkr) {
        _this.state = wrkr;
        startGame();
      });

      startGame();
    }

    _createClass(Game, [{
      key: 'onClick',
      value: function onClick(e) {
        if (this.userTurn) {
          this.userTurn = false;

          var _html$clickCoords = html.clickCoords(e);

          var x = _html$clickCoords.x;
          var y = _html$clickCoords.y;

          this.tryMove(this.field.getCellPosition(x, y));
        } else {
          console.log('Please wait for your turn.');
        }
      }
    }, {
      key: 'respond',
      value: function respond(message) {
        console.log('time: ' + message.data.aiSpeed);
        if (message.data.aiMove) {
          this.tryMove(message.data.aiMove);
          console.log('minimax score: ' + message.data.aiMove.score[0]);
        } else {
          this.action(message.data);
        }
      }
    }, {
      key: 'tryMove',
      value: function tryMove(cell) {
        this.state.postMessage({ move: cell });
      }
    }, {
      key: 'action',
      value: function action(result) {
        if (result) {
          if (result.success) {
            var _result$lastMove = result.lastMove;
            var row = _result$lastMove.row;
            var col = _result$lastMove.col;
            var player = _result$lastMove.player;

            this.picture.drawSign(row, col, player.id);
          }
          if (result.terminate) {
            this.state.terminate();
            console.log('Game ended.');
          } else if (result.player.isUser) {
            this.userTurn = true;
            console.log('User turn.');
          } else {
            this.state.postMessage({ ai: true });
            console.log('AI turn.');
          }
        } else {
          this.state.postMessage(0);
        }
      }
    }]);

    return Game;
  }();
});
//# sourceMappingURL=data:application/json;base64,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V0FITSxNQUdBO0FBQ0wsaUJBQUssS0FBTCxDQUFXLFdBQVgsQ0FBdUIsRUFBRSxJQUFJLElBQU4sRUFBdkI7QUFDQSxvQkFBUSxHQUFSLENBQVksVUFBWjtBQUNEO0FBQ0YsU0FmRCxNQWVPO0FBQ0wsZUFBSyxLQUFMLENBQVcsV0FBWCxDQUF1QixDQUF2QjtBQUNEO0FBQ0Y7QUF6RkQ7O0FBQUE7QUFBQTtBQUFBLENBRkoiLCJmaWxlIjoianMvYXBwL2dhbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIE1ha2luZyBjYW52YXMgYW5kIHdvcmtlciBpcyBub3QgaW4gY29uZmlnXHJcbi8vIFRPRE8gQWRkIHRpbWluZ3MgaW4gYWN0aW9uXHJcbi8vIFRPRE8gQXNrIHVzZXIgdG8gd2FpdCBvciB0ZXJtaW5hdGUgaWYgdXNlciBjbGlja3Mgd2hpbGUgQUkgd29ya2luZ1xyXG4vLyBUT0RPIEFzayB1c2VyIHRvIG1ha2UgdHVybiB3aXRob3V0IGNvbnNvbGVcclxuLy8gVE9ETyBBZGQgc29tZSBpZGxlIHRpbWUgZm9yIGRyYXduaW5nIGZpZWxkXHJcbi8vIFRPRE8gTWF5YmUgRmllbGQgYW5kIENhbnZhcyBzaG91bGQgbm90IGJlIG1hZGUgaGVyZVxyXG4vLyBUT0RPIE1hbnkgc3RyaW5nIHZhbHVlcyBzaG91bGQgYmUgaW4gY29uZmlnXHJcbi8vIFRPRE8gQWRkIGVuZCBnYW1lIGZ1bmN0aW9uYWxpdHlcclxuLy8gVE9ETyBNYXliZSB1c2VyVHVybiBmbGFnIGlzIG5vdCBuZWVkZWRcclxuLy8gR2FtZSBtYWluIHByZXNlbnRlclxyXG5kZWZpbmUoXHJcbiAgICBbJy4vY29uZmlnJywgJy4vYXNzZXRzJywgJy4vdXRpbGl0aWVzJywgJy4vd29ya2VyJywgJy4vZmllbGQnLCAnLi9waWN0dXJlJ10sXHJcbiAgICAoeyBnZW5lcmFsOiBjZmcsIGFzc2V0czogbGlua3MgfSwgeyBpbWFnZXMgfSwgeyB3b3JrZXIsIGh0bWwgfSwgY29kZSxcclxuICAgICAgICBGaWVsZCwgUGljdHVyZSkgPT5cclxuICBjbGFzcyBHYW1lIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpZCA9IDAsIGFtZENmZykge1xyXG4gICAgICBsZXQgd2FpdExvYWQgPSB0aGlzLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goL3N0YXJ0R2FtZS9nKS5sZW5ndGggLSAyO1xyXG4gICAgICBjb25zdCBzdGFydEdhbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKC0td2FpdExvYWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLnBpY3R1cmUuZHJhd0ZpZWxkKCk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24oKTtcclxuICAgICAgfTtcclxuICAgICAgdGhpcy51c2VyVHVybiA9IGZhbHNlO1xyXG5cclxuICAgICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCgpO1xyXG4gICAgICB0aGlzLmNhbnZhcyA9IGh0bWwubWFrZUNhbnZhcyhcclxuICAgICAgICAgIGB0cmlwbGV0LSR7aWR9YCxcclxuICAgICAgICAgIGNmZy5sZWZ0ICsgY2ZnLnJpZ2h0ICsgdGhpcy5maWVsZC53aWR0aCxcclxuICAgICAgICAgIGNmZy50b3AgKyBjZmcuYm90dG9tICsgdGhpcy5maWVsZC5oZWlnaHQsXHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdKTtcclxuICAgICAgdGhpcy5waWN0dXJlID0gbmV3IFBpY3R1cmUodGhpcy5maWVsZCwgdGhpcy5jYW52YXMpO1xyXG5cclxuICAgICAgaW1hZ2VzLmxvYWQobGlua3MuaW1hZ2VzKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5waWN0dXJlLmluaXRpYWxpemUoaW1hZ2VzLnBvb2wpKVxyXG4gICAgICAgICAgLmNhdGNoKCgpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICB0aGlzLnBpY3R1cmUuaW5pdGlhbGl6ZShpbWFnZXMucG9vbCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRvbyBtYW55IHNwcml0ZXMgYXJlIG1pc3NlZDogJHtpbWFnZXMucG9vbH1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHN0YXJ0R2FtZSgpKTtcclxuXHJcbiAgICAgIHdvcmtlci5mcm9tRm4oe1xyXG4gICAgICAgIGNvZGUsXHJcbiAgICAgICAgYXJnczogYW1kQ2ZnLFxyXG4gICAgICAgIGhhbmRsZXI6IHRoaXMucmVzcG9uZC5iaW5kKHRoaXMpLFxyXG4gICAgICAgIGhyZWY6IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvW15cXC9dKiQvLCAnJyksXHJcbiAgICAgIH0pLnRoZW4od3JrciA9PiB7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHdya3I7XHJcbiAgICAgICAgc3RhcnRHYW1lKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgc3RhcnRHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25DbGljayhlKSB7XHJcbiAgICAgIGlmICh0aGlzLnVzZXJUdXJuKSB7XHJcbiAgICAgICAgdGhpcy51c2VyVHVybiA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gaHRtbC5jbGlja0Nvb3JkcyhlKTtcclxuICAgICAgICB0aGlzLnRyeU1vdmUodGhpcy5maWVsZC5nZXRDZWxsUG9zaXRpb24oeCwgeSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdQbGVhc2Ugd2FpdCBmb3IgeW91ciB0dXJuLicpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVzcG9uZChtZXNzYWdlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGB0aW1lOiAke21lc3NhZ2UuZGF0YS5haVNwZWVkfWApO1xyXG4gICAgICBpZiAobWVzc2FnZS5kYXRhLmFpTW92ZSkge1xyXG4gICAgICAgIHRoaXMudHJ5TW92ZShtZXNzYWdlLmRhdGEuYWlNb3ZlKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgbWluaW1heCBzY29yZTogJHttZXNzYWdlLmRhdGEuYWlNb3ZlLnNjb3JlWzBdfWApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYWN0aW9uKG1lc3NhZ2UuZGF0YSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0cnlNb3ZlKGNlbGwpIHtcclxuICAgICAgdGhpcy5zdGF0ZS5wb3N0TWVzc2FnZSh7IG1vdmU6IGNlbGwgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWN0aW9uKHJlc3VsdCkge1xyXG4gICAgICBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICBjb25zdCB7IHJvdywgY29sLCBwbGF5ZXIgfSA9IHJlc3VsdC5sYXN0TW92ZTtcclxuICAgICAgICAgIHRoaXMucGljdHVyZS5kcmF3U2lnbihyb3csIGNvbCwgcGxheWVyLmlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlc3VsdC50ZXJtaW5hdGUpIHtcclxuICAgICAgICAgIHRoaXMuc3RhdGUudGVybWluYXRlKCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnR2FtZSBlbmRlZC4nKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5wbGF5ZXIuaXNVc2VyKSB7XHJcbiAgICAgICAgICB0aGlzLnVzZXJUdXJuID0gdHJ1ZTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIHR1cm4uJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuc3RhdGUucG9zdE1lc3NhZ2UoeyBhaTogdHJ1ZSB9KTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdBSSB0dXJuLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKDApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
