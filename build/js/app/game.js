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
// Game main presenter
define(['./config', './assets', './utilities', './field', './picture'], function (_ref, _ref2, _ref3, Field, Picture) {
  var cfg = _ref.general;
  var links = _ref.assets;
  var images = _ref2.images;
  var worker = _ref3.worker;
  var html = _ref3.html;
  return function () {
    function Game() {
      var _this = this;

      var id = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      _classCallCheck(this, Game);

      var partsToLoad = 3;
      var startGame = function startGame() {
        if (--partsToLoad) return;
        _this.picture.drawField();
        _this.canvas.addEventListener('click', _this.onClick.bind(_this));
        _this.action();
      };
      this.userTurn = false;

      images.load(links.images, startGame);
      this.state = worker.make({
        file: 'worker.js',
        onload: startGame,
        handler: this.respond.bind(this),
        importFrom: document.location.href.replace(/[^\/]*$/, '') + 'js/'
      });

      this.field = new Field();
      this.canvas = html.makeCanvas('triplet-' + id, cfg.left + cfg.right + this.field.width, cfg.top + cfg.bottom + this.field.height, document.getElementsByTagName('body')[0]);
      this.picture = new Picture(this.field, this.canvas);

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
//# sourceMappingURL=data:application/json;base64,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RDVELElBdEQ0RCxFQXNEdEQ7QUFDWixhQUFLLEtBQUwsQ0FBVyxXQUFYLENBQXVCLEVBQUUsTUFBTSxJQUFSLEVBQXZCO0FBQ0Q7QUF4RG1FO0FBQUE7QUFBQSw2QkEwRDdELE1BMUQ2RCxFQTBEckQ7QUFDYixZQUFJLE1BQUosRUFBWTtBQUNWLGNBQUksT0FBTyxPQUFYLEVBQW9CO0FBQUEsbUNBQ1csT0FBTyxRQURsQjtBQUFBLGdCQUNWLEdBRFUsb0JBQ1YsR0FEVTtBQUFBLGdCQUNMLEdBREssb0JBQ0wsR0FESztBQUFBLGdCQUNBLE1BREEsb0JBQ0EsTUFEQTs7QUFFbEIsaUJBQUssT0FBTCxDQUFhLFFBQWIsQ0FBc0IsR0FBdEIsRUFBMkIsR0FBM0IsRUFBZ0MsTUFBaEM7QUFDRDtBQUNELGNBQUksT0FBTyxNQUFQLENBQWMsTUFBbEIsRUFBMEI7QUFDeEIsaUJBQUssUUFBTCxHQUFnQixJQUFoQjtBQUNBLG9CQUFRLEdBQVIsQ0FBWSxZQUFaO0FBQ0QsV0FIRCxNQUdPLElBQUksT0FBTyxNQUFQLEtBQWtCLElBQXRCLEVBQTRCO0FBQ2pDLGlCQUFLLEtBQUwsQ0FBVyxXQUFYLENBQXVCLEVBQUUsSUFBSSxJQUFOLEVBQXZCO0FBQ0QsV0FGTSxNQUVBO0FBQ0wsaUJBQUssS0FBTCxDQUFXLFNBQVg7QUFDQSxrQkFBTSxJQUFJLEtBQUosQ0FBVSxnREFBVixDQUFOO0FBQ0Q7QUFDRixTQWRELE1BY087QUFDTCxlQUFLLEtBQUwsQ0FBVyxXQUFYLENBQXVCLENBQXZCO0FBQ0Q7QUFDRjtBQTVFbUU7O0FBQUE7QUFBQTtBQUFBLENBQXhFIiwiZmlsZSI6ImpzL2FwcC9nYW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETyBNYWtpbmcgY2FudmFzIGFuZCB3b3JrZXIgaXMgbm90IGluIGNvbmZpZ1xyXG4vLyBUT0RPIEFkZCB0aW1pbmdzIGluIGFjdGlvblxyXG4vLyBUT0RPIEFzayB1c2VyIHRvIHdhaXQgb3IgdGVybWluYXRlIGlmIHVzZXIgY2xpY2tzIHdoaWxlIEFJIHdvcmtpbmdcclxuLy8gVE9ETyBBc2sgdXNlciB0byBtYWtlIHR1cm4gd2l0aG91dCBjb25zb2xlXHJcbi8vIFRPRE8gQWRkIHNvbWUgaWRsZSB0aW1lIGZvciBkcmF3bmluZyBmaWVsZFxyXG4vLyBUT0RPIE1heWJlIEZpZWxkIGFuZCBDYW52YXMgc2hvdWxkIG5vdCBiZSBtYWRlIGhlcmVcclxuLy8gVE9ETyBNYXliZSBwYXJ0c1RvTG9hZCBzaG91bGQgYmUgZHluYW1pYyBvciBwcml2YXRlIG51bWJlclxyXG4vLyBUT0RPIE1hbnkgc3RyaW5nIHZhbHVlcyBzaG91bGQgYmUgaW4gY29uZmlnXHJcbi8vIEdhbWUgbWFpbiBwcmVzZW50ZXJcclxuZGVmaW5lKFsnLi9jb25maWcnLCAnLi9hc3NldHMnLCAnLi91dGlsaXRpZXMnLCAnLi9maWVsZCcsICcuL3BpY3R1cmUnXSwgKFxyXG4gICAgeyBnZW5lcmFsOiBjZmcsIGFzc2V0czogbGlua3MgfSwgeyBpbWFnZXMgfSwgeyB3b3JrZXIsIGh0bWwgfSxcclxuICAgIEZpZWxkLCBQaWN0dXJlKSA9PlxyXG4gIGNsYXNzIEdhbWUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlkID0gMCkge1xyXG4gICAgICBsZXQgcGFydHNUb0xvYWQgPSAzO1xyXG4gICAgICBjb25zdCBzdGFydEdhbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKC0tcGFydHNUb0xvYWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLnBpY3R1cmUuZHJhd0ZpZWxkKCk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24oKTtcclxuICAgICAgfTtcclxuICAgICAgdGhpcy51c2VyVHVybiA9IGZhbHNlO1xyXG5cclxuICAgICAgaW1hZ2VzLmxvYWQobGlua3MuaW1hZ2VzLCBzdGFydEdhbWUpO1xyXG4gICAgICB0aGlzLnN0YXRlID0gd29ya2VyLm1ha2Uoe1xyXG4gICAgICAgIGZpbGU6ICd3b3JrZXIuanMnLFxyXG4gICAgICAgIG9ubG9hZDogc3RhcnRHYW1lLFxyXG4gICAgICAgIGhhbmRsZXI6IHRoaXMucmVzcG9uZC5iaW5kKHRoaXMpLFxyXG4gICAgICAgIGltcG9ydEZyb206IGAke2RvY3VtZW50LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvW15cXC9dKiQvLCAnJyl9anMvYCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLmZpZWxkID0gbmV3IEZpZWxkKCk7XHJcbiAgICAgIHRoaXMuY2FudmFzID0gaHRtbC5tYWtlQ2FudmFzKFxyXG4gICAgICAgICAgYHRyaXBsZXQtJHtpZH1gLFxyXG4gICAgICAgICAgY2ZnLmxlZnQgKyBjZmcucmlnaHQgKyB0aGlzLmZpZWxkLndpZHRoLFxyXG4gICAgICAgICAgY2ZnLnRvcCArIGNmZy5ib3R0b20gKyB0aGlzLmZpZWxkLmhlaWdodCxcclxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0pO1xyXG4gICAgICB0aGlzLnBpY3R1cmUgPSBuZXcgUGljdHVyZSh0aGlzLmZpZWxkLCB0aGlzLmNhbnZhcyk7XHJcblxyXG4gICAgICBzdGFydEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNsaWNrKGUpIHtcclxuICAgICAgaWYgKHRoaXMudXNlclR1cm4pIHtcclxuICAgICAgICB0aGlzLnVzZXJUdXJuID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgeyB4LCB5IH0gPSBodG1sLmNsaWNrQ29vcmRzKGUpO1xyXG4gICAgICAgIHRoaXMudHJ5TW92ZSh0aGlzLmZpZWxkLmdldENlbGxQb3NpdGlvbih4LCB5KSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1BsZWFzZSB3YWl0IGZvciB5b3VyIHR1cm4uJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXNwb25kKG1lc3NhZ2UpIHtcclxuICAgICAgY29uc29sZS5sb2coYHRpbWU6ICR7bWVzc2FnZS5kYXRhLmFpU3BlZWR9YCk7XHJcbiAgICAgIGlmIChtZXNzYWdlLmRhdGEuYWlNb3ZlKSB7XHJcbiAgICAgICAgdGhpcy50cnlNb3ZlKG1lc3NhZ2UuZGF0YS5haU1vdmUpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBtaW5pbWF4IHNjb3JlOiAke21lc3NhZ2UuZGF0YS5haU1vdmUuc2NvcmVbMF19YCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24obWVzc2FnZS5kYXRhKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRyeU1vdmUoY2VsbCkge1xyXG4gICAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKHsgbW92ZTogY2VsbCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgIGNvbnN0IHsgcm93LCBjb2wsIHBsYXllciB9ID0gcmVzdWx0Lmxhc3RNb3ZlO1xyXG4gICAgICAgICAgdGhpcy5waWN0dXJlLmRyYXdTaWduKHJvdywgY29sLCBwbGF5ZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVzdWx0LnBsYXllci5pc1VzZXIpIHtcclxuICAgICAgICAgIHRoaXMudXNlclR1cm4gPSB0cnVlO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgdHVybi4nKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5haU1vdmUgIT09IG51bGwpIHtcclxuICAgICAgICAgIHRoaXMuc3RhdGUucG9zdE1lc3NhZ2UoeyBhaTogdHJ1ZSB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS50ZXJtaW5hdGUoKTtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV29ya2VyIGZhaWxlZCBhbmQgd2FzIHRlcm1pbmF0ZWQuIFJlc3RhcnQgYXBwLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXRlLnBvc3RNZXNzYWdlKDApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
