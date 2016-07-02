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
      // Not an arrow function because of possible compilation errors
      function startGame() {
        if (--waitLoad) return;
        this.picture.drawField();
        this.canvas.addEventListener('click', this.onClick.bind(this));
        this.action();
      }

      this.userTurn = false;
      this.field = new Field();
      this.canvas = html.makeCanvas('triplet-' + id, cfg.left + cfg.right + this.field.width, cfg.top + cfg.bottom + this.field.height, document.getElementsByTagName('body')[0]);
      this.picture = new Picture(this.field, this.canvas);

      var tryInitSprites = function tryInitSprites() {
        return _this.picture.initialize(images.pool);
      };
      images.load(links.images).then(tryInitSprites, tryInitSprites).then(function () {
        return startGame.call(_this);
      }).catch(function () {
        throw new Error('Many sprites are missed: ' + images.pool);
      });

      worker.fromFn({
        code: code,
        args: amdCfg,
        handler: this.respond.bind(this),
        href: document.location.href.replace(/[^\/]*$/, '')
      }).then(function (wrkr) {
        _this.state = wrkr;
        startGame.call(_this);
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
//# sourceMappingURL=data:application/json;base64,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QUFMLENBQVcsV0FBWCxDQUF1QixFQUFFLElBQUksSUFBTixFQUF2QjtBQUNBLG9CQUFRLEdBQVIsQ0FBWSxVQUFaO0FBQ0Q7QUFDRixTQWZELE1BZU87QUFDTCxlQUFLLEtBQUwsQ0FBVyxXQUFYLENBQXVCLENBQXZCO0FBQ0Q7QUFDRjtBQXZGRDs7QUFBQTtBQUFBO0FBQUEsQ0FGSiIsImZpbGUiOiJqcy9hcHAvZ2FtZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gTWFraW5nIGNhbnZhcyBhbmQgd29ya2VyIGlzIG5vdCBpbiBjb25maWdcclxuLy8gVE9ETyBBZGQgdGltaW5ncyBpbiBhY3Rpb25cclxuLy8gVE9ETyBBc2sgdXNlciB0byB3YWl0IG9yIHRlcm1pbmF0ZSBpZiB1c2VyIGNsaWNrcyB3aGlsZSBBSSB3b3JraW5nXHJcbi8vIFRPRE8gQXNrIHVzZXIgdG8gbWFrZSB0dXJuIHdpdGhvdXQgY29uc29sZVxyXG4vLyBUT0RPIEFkZCBzb21lIGlkbGUgdGltZSBmb3IgZHJhd25pbmcgZmllbGRcclxuLy8gVE9ETyBNYXliZSBGaWVsZCBhbmQgQ2FudmFzIHNob3VsZCBub3QgYmUgbWFkZSBoZXJlXHJcbi8vIFRPRE8gTWFueSBzdHJpbmcgdmFsdWVzIHNob3VsZCBiZSBpbiBjb25maWdcclxuLy8gVE9ETyBBZGQgZW5kIGdhbWUgZnVuY3Rpb25hbGl0eVxyXG4vLyBUT0RPIE1heWJlIHVzZXJUdXJuIGZsYWcgaXMgbm90IG5lZWRlZFxyXG4vLyBHYW1lIG1haW4gcHJlc2VudGVyXHJcbmRlZmluZShcclxuICAgIFsnLi9jb25maWcnLCAnLi9hc3NldHMnLCAnLi91dGlsaXRpZXMnLCAnLi93b3JrZXInLCAnLi9maWVsZCcsICcuL3BpY3R1cmUnXSxcclxuICAgICh7IGdlbmVyYWw6IGNmZywgYXNzZXRzOiBsaW5rcyB9LCB7IGltYWdlcyB9LCB7IHdvcmtlciwgaHRtbCB9LCBjb2RlLFxyXG4gICAgICAgIEZpZWxkLCBQaWN0dXJlKSA9PlxyXG4gIGNsYXNzIEdhbWUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlkID0gMCwgYW1kQ2ZnKSB7XHJcbiAgICAgIGxldCB3YWl0TG9hZCA9IHRoaXMuY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvc3RhcnRHYW1lL2cpLmxlbmd0aCAtIDI7XHJcbiAgICAgIC8vIE5vdCBhbiBhcnJvdyBmdW5jdGlvbiBiZWNhdXNlIG9mIHBvc3NpYmxlIGNvbXBpbGF0aW9uIGVycm9yc1xyXG4gICAgICBmdW5jdGlvbiBzdGFydEdhbWUoKSB7XHJcbiAgICAgICAgaWYgKC0td2FpdExvYWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLnBpY3R1cmUuZHJhd0ZpZWxkKCk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24oKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy51c2VyVHVybiA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmZpZWxkID0gbmV3IEZpZWxkKCk7XHJcbiAgICAgIHRoaXMuY2FudmFzID0gaHRtbC5tYWtlQ2FudmFzKFxyXG4gICAgICAgICAgYHRyaXBsZXQtJHtpZH1gLFxyXG4gICAgICAgICAgY2ZnLmxlZnQgKyBjZmcucmlnaHQgKyB0aGlzLmZpZWxkLndpZHRoLFxyXG4gICAgICAgICAgY2ZnLnRvcCArIGNmZy5ib3R0b20gKyB0aGlzLmZpZWxkLmhlaWdodCxcclxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0pO1xyXG4gICAgICB0aGlzLnBpY3R1cmUgPSBuZXcgUGljdHVyZSh0aGlzLmZpZWxkLCB0aGlzLmNhbnZhcyk7XHJcblxyXG4gICAgICBjb25zdCB0cnlJbml0U3ByaXRlcyA9ICgpID0+IHRoaXMucGljdHVyZS5pbml0aWFsaXplKGltYWdlcy5wb29sKTtcclxuICAgICAgaW1hZ2VzLmxvYWQobGlua3MuaW1hZ2VzKVxyXG4gICAgICAgICAgLnRoZW4odHJ5SW5pdFNwcml0ZXMsIHRyeUluaXRTcHJpdGVzKVxuICAgICAgICAgIC50aGVuKCgpID0+IHN0YXJ0R2FtZS5jYWxsKHRoaXMpKVxyXG4gICAgICAgICAgLmNhdGNoKCgpID0+IHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYW55IHNwcml0ZXMgYXJlIG1pc3NlZDogJHtpbWFnZXMucG9vbH1gKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgd29ya2VyLmZyb21Gbih7XHJcbiAgICAgICAgY29kZSxcclxuICAgICAgICBhcmdzOiBhbWRDZmcsXHJcbiAgICAgICAgaGFuZGxlcjogdGhpcy5yZXNwb25kLmJpbmQodGhpcyksXHJcbiAgICAgICAgaHJlZjogZG9jdW1lbnQubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9bXlxcL10qJC8sICcnKSxcclxuICAgICAgfSkudGhlbih3cmtyID0+IHtcclxuICAgICAgICB0aGlzLnN0YXRlID0gd3JrcjtcclxuICAgICAgICBzdGFydEdhbWUuY2FsbCh0aGlzKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBzdGFydEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNsaWNrKGUpIHtcclxuICAgICAgaWYgKHRoaXMudXNlclR1cm4pIHtcclxuICAgICAgICB0aGlzLnVzZXJUdXJuID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgeyB4LCB5IH0gPSBodG1sLmNsaWNrQ29vcmRzKGUpO1xyXG4gICAgICAgIHRoaXMudHJ5TW92ZSh0aGlzLmZpZWxkLmdldENlbGxQb3NpdGlvbih4LCB5KSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1BsZWFzZSB3YWl0IGZvciB5b3VyIHR1cm4uJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXNwb25kKG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYHRpbWU6ICR7bWVzc2FnZS5kYXRhLmFpU3BlZWR9YCk7XHJcbiAgICAgIGlmIChtZXNzYWdlLmRhdGEuYWlNb3ZlKSB7XHJcbiAgICAgICAgdGhpcy50cnlNb3ZlKG1lc3NhZ2UuZGF0YS5haU1vdmUpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBtaW5pbWF4IHNjb3JlOiAke21lc3NhZ2UuZGF0YS5haU1vdmUuc2NvcmVbMF19YCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24obWVzc2FnZS5kYXRhKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRyeU1vdmUoY2VsbCkge1xyXG4gICAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKHsgbW92ZTogY2VsbCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgIGNvbnN0IHsgcm93LCBjb2wsIHBsYXllciB9ID0gcmVzdWx0Lmxhc3RNb3ZlO1xyXG4gICAgICAgICAgdGhpcy5waWN0dXJlLmRyYXdTaWduKHJvdywgY29sLCBwbGF5ZXIuaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVzdWx0LnRlcm1pbmF0ZSkge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS50ZXJtaW5hdGUoKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdHYW1lIGVuZGVkLicpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnBsYXllci5pc1VzZXIpIHtcclxuICAgICAgICAgIHRoaXMudXNlclR1cm4gPSB0cnVlO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgdHVybi4nKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS5wb3N0TWVzc2FnZSh7IGFpOiB0cnVlIH0pO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0FJIHR1cm4uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhdGUucG9zdE1lc3NhZ2UoMCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
