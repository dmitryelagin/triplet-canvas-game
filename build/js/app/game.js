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
define(['./config', './assets', './utilities', './worker', './field', './picture'], function (_ref, _ref2, _ref3, code, Field, Picture) {
  var cfg = _ref.general;
  var links = _ref.assets;
  var images = _ref2.images;
  var worker = _ref3.worker;
  var html = _ref3.html;
  return(
    // Game main presenter
    function () {
      function Game() {
        var _this = this;

        var id = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
        var amdCfg = arguments[1];

        _classCallCheck(this, Game);

        this.userTurn = false;

        this.field = new Field();
        this.canvas = html.makeCanvas('triplet-' + id, cfg.left + cfg.right + this.field.width, cfg.top + cfg.bottom + this.field.height, document.getElementsByTagName('body')[0]);
        this.picture = new Picture(this.field, this.canvas);

        var loaded = [];
        var tryInitSprites = function tryInitSprites() {
          return _this.picture.initialize(images.pool);
        };

        loaded.push(images.load(links.images).then(tryInitSprites, tryInitSprites).catch(function () {
          throw new Error('Many sprites are missed: ' + images.pool);
        }));

        loaded.push(worker.fromFn({
          code: code,
          args: amdCfg,
          handler: this.respond.bind(this),
          href: document.location.href.replace(/[^\/]*$/, '')
        }).then(function (wrkr) {
          _this.state = wrkr;
        }));

        Promise.all(loaded).then(function () {
          _this.picture.drawField();
          _this.canvas.addEventListener('click', _this.onClick.bind(_this));
          _this.action();
        });
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
    }()
  );
});
//# sourceMappingURL=data:application/json;base64,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QUFDRixXQWZELE1BZU87QUFDTCxpQkFBSyxLQUFMLENBQVcsV0FBWCxDQUF1QixDQUF2QjtBQUNEO0FBQ0Y7QUFsRkQ7O0FBQUE7QUFBQTtBQUFBO0FBQUEsQ0FGSiIsImZpbGUiOiJqcy9hcHAvZ2FtZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gTWFraW5nIGNhbnZhcyBhbmQgd29ya2VyIGlzIG5vdCBpbiBjb25maWdcclxuLy8gVE9ETyBBZGQgdGltaW5ncyBpbiBhY3Rpb25cclxuLy8gVE9ETyBBc2sgdXNlciB0byB3YWl0IG9yIHRlcm1pbmF0ZSBpZiB1c2VyIGNsaWNrcyB3aGlsZSBBSSB3b3JraW5nXHJcbi8vIFRPRE8gQXNrIHVzZXIgdG8gbWFrZSB0dXJuIHdpdGhvdXQgY29uc29sZVxyXG4vLyBUT0RPIEFkZCBzb21lIGlkbGUgdGltZSBmb3IgZHJhd25pbmcgZmllbGRcclxuLy8gVE9ETyBNYXliZSBGaWVsZCBhbmQgQ2FudmFzIHNob3VsZCBub3QgYmUgbWFkZSBoZXJlXHJcbi8vIFRPRE8gTWFueSBzdHJpbmcgdmFsdWVzIHNob3VsZCBiZSBpbiBjb25maWdcclxuLy8gVE9ETyBBZGQgZW5kIGdhbWUgZnVuY3Rpb25hbGl0eVxyXG4vLyBUT0RPIE1heWJlIHVzZXJUdXJuIGZsYWcgaXMgbm90IG5lZWRlZFxyXG5kZWZpbmUoXHJcbiAgICBbJy4vY29uZmlnJywgJy4vYXNzZXRzJywgJy4vdXRpbGl0aWVzJywgJy4vd29ya2VyJywgJy4vZmllbGQnLCAnLi9waWN0dXJlJ10sXHJcbiAgICAoeyBnZW5lcmFsOiBjZmcsIGFzc2V0czogbGlua3MgfSwgeyBpbWFnZXMgfSwgeyB3b3JrZXIsIGh0bWwgfSwgY29kZSxcclxuICAgICAgICBGaWVsZCwgUGljdHVyZSkgPT5cclxuICAvLyBHYW1lIG1haW4gcHJlc2VudGVyXHJcbiAgY2xhc3MgR2FtZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaWQgPSAwLCBhbWRDZmcpIHtcclxuICAgICAgdGhpcy51c2VyVHVybiA9IGZhbHNlO1xyXG5cclxuICAgICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCgpO1xyXG4gICAgICB0aGlzLmNhbnZhcyA9IGh0bWwubWFrZUNhbnZhcyhcclxuICAgICAgICAgIGB0cmlwbGV0LSR7aWR9YCxcclxuICAgICAgICAgIGNmZy5sZWZ0ICsgY2ZnLnJpZ2h0ICsgdGhpcy5maWVsZC53aWR0aCxcclxuICAgICAgICAgIGNmZy50b3AgKyBjZmcuYm90dG9tICsgdGhpcy5maWVsZC5oZWlnaHQsXHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdKTtcclxuICAgICAgdGhpcy5waWN0dXJlID0gbmV3IFBpY3R1cmUodGhpcy5maWVsZCwgdGhpcy5jYW52YXMpO1xyXG5cclxuICAgICAgY29uc3QgbG9hZGVkID0gW107XHJcbiAgICAgIGNvbnN0IHRyeUluaXRTcHJpdGVzID0gKCkgPT4gdGhpcy5waWN0dXJlLmluaXRpYWxpemUoaW1hZ2VzLnBvb2wpO1xyXG5cclxuICAgICAgbG9hZGVkLnB1c2goaW1hZ2VzLmxvYWQobGlua3MuaW1hZ2VzKVxyXG4gICAgICAgICAgLnRoZW4odHJ5SW5pdFNwcml0ZXMsIHRyeUluaXRTcHJpdGVzKVxyXG4gICAgICAgICAgLmNhdGNoKCgpID0+IHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYW55IHNwcml0ZXMgYXJlIG1pc3NlZDogJHtpbWFnZXMucG9vbH1gKTtcclxuICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgIGxvYWRlZC5wdXNoKHdvcmtlci5mcm9tRm4oe1xyXG4gICAgICAgIGNvZGUsXHJcbiAgICAgICAgYXJnczogYW1kQ2ZnLFxyXG4gICAgICAgIGhhbmRsZXI6IHRoaXMucmVzcG9uZC5iaW5kKHRoaXMpLFxyXG4gICAgICAgIGhyZWY6IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvW15cXC9dKiQvLCAnJyksXHJcbiAgICAgIH0pLnRoZW4od3JrciA9PiB7IHRoaXMuc3RhdGUgPSB3cmtyOyB9KSk7XHJcblxyXG4gICAgICBQcm9taXNlLmFsbChsb2FkZWQpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHRoaXMucGljdHVyZS5kcmF3RmllbGQoKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljay5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmFjdGlvbigpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNsaWNrKGUpIHtcclxuICAgICAgaWYgKHRoaXMudXNlclR1cm4pIHtcclxuICAgICAgICB0aGlzLnVzZXJUdXJuID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgeyB4LCB5IH0gPSBodG1sLmNsaWNrQ29vcmRzKGUpO1xyXG4gICAgICAgIHRoaXMudHJ5TW92ZSh0aGlzLmZpZWxkLmdldENlbGxQb3NpdGlvbih4LCB5KSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1BsZWFzZSB3YWl0IGZvciB5b3VyIHR1cm4uJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXNwb25kKG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYHRpbWU6ICR7bWVzc2FnZS5kYXRhLmFpU3BlZWR9YCk7XHJcbiAgICAgIGlmIChtZXNzYWdlLmRhdGEuYWlNb3ZlKSB7XHJcbiAgICAgICAgdGhpcy50cnlNb3ZlKG1lc3NhZ2UuZGF0YS5haU1vdmUpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBtaW5pbWF4IHNjb3JlOiAke21lc3NhZ2UuZGF0YS5haU1vdmUuc2NvcmVbMF19YCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24obWVzc2FnZS5kYXRhKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRyeU1vdmUoY2VsbCkge1xyXG4gICAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKHsgbW92ZTogY2VsbCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgIGNvbnN0IHsgcm93LCBjb2wsIHBsYXllciB9ID0gcmVzdWx0Lmxhc3RNb3ZlO1xyXG4gICAgICAgICAgdGhpcy5waWN0dXJlLmRyYXdTaWduKHJvdywgY29sLCBwbGF5ZXIuaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVzdWx0LnRlcm1pbmF0ZSkge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS50ZXJtaW5hdGUoKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdHYW1lIGVuZGVkLicpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnBsYXllci5pc1VzZXIpIHtcclxuICAgICAgICAgIHRoaXMudXNlclR1cm4gPSB0cnVlO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgdHVybi4nKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS5wb3N0TWVzc2FnZSh7IGFpOiB0cnVlIH0pO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0FJIHR1cm4uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhdGUucG9zdE1lc3NhZ2UoMCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
