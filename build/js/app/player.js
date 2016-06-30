'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Maybe throw exeption if there is no signID
// TODO Maybe no need in exeptions at all
// Player constructor
define(['./config'], function (_ref) {
    var cfg = _ref.general;
    var aiCfg = _ref.ai;
    return function () {
        function Player(_ref2, id) {
            var _ref2$signID = _ref2.signID;
            var signID = _ref2$signID === undefined ? 'x' : _ref2$signID;
            var _ref2$color = _ref2.color;
            var color = _ref2$color === undefined ? '#444' : _ref2$color;
            var _ref2$ai = _ref2.ai;
            var ai = _ref2$ai === undefined ? 'none' : _ref2$ai;

            _classCallCheck(this, Player);

            if (!Number.isInteger(id)) throw new TypeError('Bad player ID: ' + id);
            this.id = id;
            this.signID = signID;
            this.color = color;
            this.ai = aiCfg[ai] || aiCfg.none;
            this.isUser = this.ai === aiCfg.none;
            this.maxTurns = this.countTurns(cfg.maxTurns);
            Object.freeze(this);
        }

        _createClass(Player, [{
            key: 'countTurns',
            value: function countTurns(totalTurns) {
                var endedRoundsTurns = ~ ~(totalTurns / cfg.turnsPerRound) * cfg.signsPerRound;
                var thisRoundTurns = totalTurns % cfg.turnsPerRound - cfg.signsPerRound * this.id;
                return endedRoundsTurns + Math.max(0, Math.min(cfg.signsPerRound, thisRoundTurns));
            }
        }]);

        return Player;
    }();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0EsT0FBTyxDQUFDLFVBQUQsQ0FBUCxFQUFxQjtBQUFBLFFBQVksR0FBWixRQUFHLE9BQUg7QUFBQSxRQUFxQixLQUFyQixRQUFpQixFQUFqQjtBQUFBO0FBR2pCLCtCQUEyRCxFQUEzRCxFQUErRDtBQUFBLHFDQUFqRCxNQUFpRDtBQUFBLGdCQUFqRCxNQUFpRCxnQ0FBeEMsR0FBd0M7QUFBQSxvQ0FBbkMsS0FBbUM7QUFBQSxnQkFBbkMsS0FBbUMsK0JBQTNCLE1BQTJCO0FBQUEsaUNBQW5CLEVBQW1CO0FBQUEsZ0JBQW5CLEVBQW1CLDRCQUFkLE1BQWM7O0FBQUE7O0FBQzdELGdCQUFJLENBQUMsT0FBTyxTQUFQLENBQWlCLEVBQWpCLENBQUwsRUFBMkIsTUFBTSxJQUFJLFNBQUoscUJBQWdDLEVBQWhDLENBQU47QUFDM0IsaUJBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxpQkFBSyxNQUFMLEdBQWMsTUFBZDtBQUNBLGlCQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EsaUJBQUssRUFBTCxHQUFVLE1BQU0sRUFBTixLQUFhLE1BQU0sSUFBN0I7QUFDQSxpQkFBSyxNQUFMLEdBQWMsS0FBSyxFQUFMLEtBQVksTUFBTSxJQUFoQztBQUNBLGlCQUFLLFFBQUwsR0FBZ0IsS0FBSyxVQUFMLENBQWdCLElBQUksUUFBcEIsQ0FBaEI7QUFDQSxtQkFBTyxNQUFQLENBQWMsSUFBZDtBQUNEOztBQVpnQjtBQUFBO0FBQUEsdUNBY04sVUFkTSxFQWNNO0FBQ3JCLG9CQUFNLG1CQUNGLEVBQUMsRUFBRSxhQUFhLElBQUksYUFBbkIsQ0FBRCxHQUFxQyxJQUFJLGFBRDdDO0FBRUEsb0JBQU0saUJBQ0YsYUFBYSxJQUFJLGFBQWpCLEdBQWlDLElBQUksYUFBSixHQUFvQixLQUFLLEVBRDlEO0FBRUEsdUJBQU8sbUJBQ0gsS0FBSyxHQUFMLENBQVMsQ0FBVCxFQUFZLEtBQUssR0FBTCxDQUFTLElBQUksYUFBYixFQUE0QixjQUE1QixDQUFaLENBREo7QUFFRDtBQXJCZ0I7O0FBQUE7QUFBQTtBQUFBLENBQXJCIiwiZmlsZSI6ImpzL2FwcC9wbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIE1heWJlIHRocm93IGV4ZXB0aW9uIGlmIHRoZXJlIGlzIG5vIHNpZ25JRFxyXG4vLyBUT0RPIE1heWJlIG5vIG5lZWQgaW4gZXhlcHRpb25zIGF0IGFsbFxyXG4vLyBQbGF5ZXIgY29uc3RydWN0b3JcclxuZGVmaW5lKFsnLi9jb25maWcnXSwgKHsgZ2VuZXJhbDogY2ZnLCBhaTogYWlDZmcgfSkgPT5cclxuICBjbGFzcyBQbGF5ZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHsgc2lnbklEID0gJ3gnLCBjb2xvciA9ICcjNDQ0JywgYWkgPSAnbm9uZScgfSwgaWQpIHtcclxuICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihgQmFkIHBsYXllciBJRDogJHtpZH1gKTtcclxuICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgICB0aGlzLnNpZ25JRCA9IHNpZ25JRDtcclxuICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gICAgICB0aGlzLmFpID0gYWlDZmdbYWldIHx8IGFpQ2ZnLm5vbmU7XHJcbiAgICAgIHRoaXMuaXNVc2VyID0gdGhpcy5haSA9PT0gYWlDZmcubm9uZTtcclxuICAgICAgdGhpcy5tYXhUdXJucyA9IHRoaXMuY291bnRUdXJucyhjZmcubWF4VHVybnMpO1xyXG4gICAgICBPYmplY3QuZnJlZXplKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvdW50VHVybnModG90YWxUdXJucykge1xyXG4gICAgICBjb25zdCBlbmRlZFJvdW5kc1R1cm5zID1cclxuICAgICAgICAgIH5+KHRvdGFsVHVybnMgLyBjZmcudHVybnNQZXJSb3VuZCkgKiBjZmcuc2lnbnNQZXJSb3VuZDtcclxuICAgICAgY29uc3QgdGhpc1JvdW5kVHVybnMgPVxyXG4gICAgICAgICAgdG90YWxUdXJucyAlIGNmZy50dXJuc1BlclJvdW5kIC0gY2ZnLnNpZ25zUGVyUm91bmQgKiB0aGlzLmlkO1xyXG4gICAgICByZXR1cm4gZW5kZWRSb3VuZHNUdXJucyArXHJcbiAgICAgICAgICBNYXRoLm1heCgwLCBNYXRoLm1pbihjZmcuc2lnbnNQZXJSb3VuZCwgdGhpc1JvdW5kVHVybnMpKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
