'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Making canvas and worker is not in config
// TODO Add timings in action
// TODO Ask user to wait or terminate if user clicks while AI working
// TODO Ask user to make turn without console
// TODO Add some idle time for drawning field
// TODO Maybe Field and Canvas should not be made here
// TODO Maybe partsToLoad should be dynamic or private number
// TODO Many string values should be in config
// TODO Add end game functionality
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

      var partsToLoad = 3;
      var tryToStartGame = function tryToStartGame() {
        if (--partsToLoad) return;
        _this.picture.drawField();
        _this.canvas.addEventListener('click', _this.onClick.bind(_this));
        _this.action();
      };
      this.userTurn = false;

      images.load(links.images, tryToStartGame);
      this.state = worker.fromFn({
        code: code, amdCfg: amdCfg,
        onload: tryToStartGame,
        handler: this.respond.bind(this),
        href: document.location.href.replace(/[^\/]*$/, '')
      });

      this.field = new Field();
      this.canvas = html.makeCanvas('triplet-' + id, cfg.left + cfg.right + this.field.width, cfg.top + cfg.bottom + this.field.height, document.getElementsByTagName('body')[0]);
      this.picture = new Picture(this.field, this.canvas);

      tryToStartGame();
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

            this.picture.drawSign(row, col, player);
          }
          if (result.player.isUser) {
            this.userTurn = true;
            console.log('User turn.');
          } else if (result.aiMove !== null) {
            this.state.postMessage({ ai: true });
          } else {
            this.state.terminate();
            throw new Error('Worker failed and was terminated. Restart app.');
          }
        } else {
          this.state.postMessage(0);
        }
      }
    }]);

    return Game;
  }();
});
//# sourceMappingURL=data:application/json;base64,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SUFBcEI7QUFDRDtBQUNGO0FBbkREO0FBQUE7QUFBQSw4QkFxRFEsSUFyRFIsRUFxRGM7QUFDWixhQUFLLEtBQUwsQ0FBVyxXQUFYLENBQXVCLEVBQUUsTUFBTSxJQUFSLEVBQXZCO0FBQ0Q7QUF2REQ7QUFBQTtBQUFBLDZCQXlETyxNQXpEUCxFQXlEZTtBQUNiLFlBQUksTUFBSixFQUFZO0FBQ1YsY0FBSSxPQUFPLE9BQVgsRUFBb0I7QUFBQSxtQ0FDVyxPQUFPLFFBRGxCO0FBQUEsZ0JBQ1YsR0FEVSxvQkFDVixHQURVO0FBQUEsZ0JBQ0wsR0FESyxvQkFDTCxHQURLO0FBQUEsZ0JBQ0EsTUFEQSxvQkFDQSxNQURBOztBQUVsQixpQkFBSyxPQUFMLENBQWEsUUFBYixDQUFzQixHQUF0QixFQUEyQixHQUEzQixFQUFnQyxNQUFoQztBQUNEO0FBQ0QsY0FBSSxPQUFPLE1BQVAsQ0FBYyxNQUFsQixFQUEwQjtBQUN4QixpQkFBSyxRQUFMLEdBQWdCLElBQWhCO0FBQ0Esb0JBQVEsR0FBUixDQUFZLFlBQVo7QUFDRCxXQUhELE1BR08sSUFBSSxPQUFPLE1BQVAsS0FBa0IsSUFBdEIsRUFBNEI7QUFDakMsaUJBQUssS0FBTCxDQUFXLFdBQVgsQ0FBdUIsRUFBRSxJQUFJLElBQU4sRUFBdkI7QUFDRCxXQUZNLE1BRUE7QUFDTCxpQkFBSyxLQUFMLENBQVcsU0FBWDtBQUNBLGtCQUFNLElBQUksS0FBSixDQUFVLGdEQUFWLENBQU47QUFDRDtBQUNGLFNBZEQsTUFjTztBQUNMLGVBQUssS0FBTCxDQUFXLFdBQVgsQ0FBdUIsQ0FBdkI7QUFDRDtBQUNGO0FBM0VEOztBQUFBO0FBQUE7QUFBQSxDQUZKIiwiZmlsZSI6ImpzL2FwcC9nYW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETyBNYWtpbmcgY2FudmFzIGFuZCB3b3JrZXIgaXMgbm90IGluIGNvbmZpZ1xyXG4vLyBUT0RPIEFkZCB0aW1pbmdzIGluIGFjdGlvblxyXG4vLyBUT0RPIEFzayB1c2VyIHRvIHdhaXQgb3IgdGVybWluYXRlIGlmIHVzZXIgY2xpY2tzIHdoaWxlIEFJIHdvcmtpbmdcclxuLy8gVE9ETyBBc2sgdXNlciB0byBtYWtlIHR1cm4gd2l0aG91dCBjb25zb2xlXHJcbi8vIFRPRE8gQWRkIHNvbWUgaWRsZSB0aW1lIGZvciBkcmF3bmluZyBmaWVsZFxyXG4vLyBUT0RPIE1heWJlIEZpZWxkIGFuZCBDYW52YXMgc2hvdWxkIG5vdCBiZSBtYWRlIGhlcmVcclxuLy8gVE9ETyBNYXliZSBwYXJ0c1RvTG9hZCBzaG91bGQgYmUgZHluYW1pYyBvciBwcml2YXRlIG51bWJlclxyXG4vLyBUT0RPIE1hbnkgc3RyaW5nIHZhbHVlcyBzaG91bGQgYmUgaW4gY29uZmlnXHJcbi8vIFRPRE8gQWRkIGVuZCBnYW1lIGZ1bmN0aW9uYWxpdHlcclxuLy8gR2FtZSBtYWluIHByZXNlbnRlclxyXG5kZWZpbmUoXHJcbiAgICBbJy4vY29uZmlnJywgJy4vYXNzZXRzJywgJy4vdXRpbGl0aWVzJywgJy4vd29ya2VyJywgJy4vZmllbGQnLCAnLi9waWN0dXJlJ10sXHJcbiAgICAoeyBnZW5lcmFsOiBjZmcsIGFzc2V0czogbGlua3MgfSwgeyBpbWFnZXMgfSwgeyB3b3JrZXIsIGh0bWwgfSwgY29kZSxcclxuICAgICAgICBGaWVsZCwgUGljdHVyZSkgPT5cclxuICBjbGFzcyBHYW1lIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpZCA9IDAsIGFtZENmZykge1xyXG4gICAgICBsZXQgcGFydHNUb0xvYWQgPSAzO1xyXG4gICAgICBjb25zdCB0cnlUb1N0YXJ0R2FtZSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoLS1wYXJ0c1RvTG9hZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMucGljdHVyZS5kcmF3RmllbGQoKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljay5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmFjdGlvbigpO1xyXG4gICAgICB9O1xyXG4gICAgICB0aGlzLnVzZXJUdXJuID0gZmFsc2U7XHJcblxyXG4gICAgICBpbWFnZXMubG9hZChsaW5rcy5pbWFnZXMsIHRyeVRvU3RhcnRHYW1lKTtcclxuICAgICAgdGhpcy5zdGF0ZSA9IHdvcmtlci5mcm9tRm4oe1xyXG4gICAgICAgIGNvZGUsIGFtZENmZyxcclxuICAgICAgICBvbmxvYWQ6IHRyeVRvU3RhcnRHYW1lLFxyXG4gICAgICAgIGhhbmRsZXI6IHRoaXMucmVzcG9uZC5iaW5kKHRoaXMpLFxyXG4gICAgICAgIGhyZWY6IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvW15cXC9dKiQvLCAnJyksXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCgpO1xyXG4gICAgICB0aGlzLmNhbnZhcyA9IGh0bWwubWFrZUNhbnZhcyhcclxuICAgICAgICAgIGB0cmlwbGV0LSR7aWR9YCxcclxuICAgICAgICAgIGNmZy5sZWZ0ICsgY2ZnLnJpZ2h0ICsgdGhpcy5maWVsZC53aWR0aCxcclxuICAgICAgICAgIGNmZy50b3AgKyBjZmcuYm90dG9tICsgdGhpcy5maWVsZC5oZWlnaHQsXHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdKTtcclxuICAgICAgdGhpcy5waWN0dXJlID0gbmV3IFBpY3R1cmUodGhpcy5maWVsZCwgdGhpcy5jYW52YXMpO1xyXG5cclxuICAgICAgdHJ5VG9TdGFydEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNsaWNrKGUpIHtcclxuICAgICAgaWYgKHRoaXMudXNlclR1cm4pIHtcclxuICAgICAgICB0aGlzLnVzZXJUdXJuID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgeyB4LCB5IH0gPSBodG1sLmNsaWNrQ29vcmRzKGUpO1xyXG4gICAgICAgIHRoaXMudHJ5TW92ZSh0aGlzLmZpZWxkLmdldENlbGxQb3NpdGlvbih4LCB5KSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1BsZWFzZSB3YWl0IGZvciB5b3VyIHR1cm4uJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXNwb25kKG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYHRpbWU6ICR7bWVzc2FnZS5kYXRhLmFpU3BlZWR9YCk7XHJcbiAgICAgIGlmIChtZXNzYWdlLmRhdGEuYWlNb3ZlKSB7XHJcbiAgICAgICAgdGhpcy50cnlNb3ZlKG1lc3NhZ2UuZGF0YS5haU1vdmUpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBtaW5pbWF4IHNjb3JlOiAke21lc3NhZ2UuZGF0YS5haU1vdmUuc2NvcmVbMF19YCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24obWVzc2FnZS5kYXRhKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRyeU1vdmUoY2VsbCkge1xyXG4gICAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKHsgbW92ZTogY2VsbCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgIGNvbnN0IHsgcm93LCBjb2wsIHBsYXllciB9ID0gcmVzdWx0Lmxhc3RNb3ZlO1xyXG4gICAgICAgICAgdGhpcy5waWN0dXJlLmRyYXdTaWduKHJvdywgY29sLCBwbGF5ZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVzdWx0LnBsYXllci5pc1VzZXIpIHtcclxuICAgICAgICAgIHRoaXMudXNlclR1cm4gPSB0cnVlO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgdHVybi4nKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5haU1vdmUgIT09IG51bGwpIHtcclxuICAgICAgICAgIHRoaXMuc3RhdGUucG9zdE1lc3NhZ2UoeyBhaTogdHJ1ZSB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS50ZXJtaW5hdGUoKTtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV29ya2VyIGZhaWxlZCBhbmQgd2FzIHRlcm1pbmF0ZWQuIFJlc3RhcnQgYXBwLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKDApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
