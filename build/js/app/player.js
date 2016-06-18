'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO Maybe throw exeption if there is no signID
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2FwcC9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFFQSxPQUFPLENBQUMsVUFBRCxDQUFQLEVBQXFCO0FBQUEsUUFBWSxHQUFaLFFBQUcsT0FBSDtBQUFBLFFBQXFCLEtBQXJCLFFBQWlCLEVBQWpCO0FBQUE7QUFHakIsK0JBQTJELEVBQTNELEVBQStEO0FBQUEscUNBQWpELE1BQWlEO0FBQUEsZ0JBQWpELE1BQWlELGdDQUF4QyxHQUF3QztBQUFBLG9DQUFuQyxLQUFtQztBQUFBLGdCQUFuQyxLQUFtQywrQkFBM0IsTUFBMkI7QUFBQSxpQ0FBbkIsRUFBbUI7QUFBQSxnQkFBbkIsRUFBbUIsNEJBQWQsTUFBYzs7QUFBQTs7QUFDN0QsZ0JBQUksQ0FBQyxPQUFPLFNBQVAsQ0FBaUIsRUFBakIsQ0FBTCxFQUEyQixNQUFNLElBQUksU0FBSixxQkFBZ0MsRUFBaEMsQ0FBTjtBQUMzQixpQkFBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLGlCQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsaUJBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxpQkFBSyxFQUFMLEdBQVUsTUFBTSxFQUFOLEtBQWEsTUFBTSxJQUE3QjtBQUNBLGlCQUFLLE1BQUwsR0FBYyxLQUFLLEVBQUwsS0FBWSxNQUFNLElBQWhDO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixLQUFLLFVBQUwsQ0FBZ0IsSUFBSSxRQUFwQixDQUFoQjtBQUNBLG1CQUFPLE1BQVAsQ0FBYyxJQUFkO0FBQ0Q7O0FBWmdCO0FBQUE7QUFBQSx1Q0FjTixVQWRNLEVBY007QUFDckIsb0JBQU0sbUJBQ0YsRUFBQyxFQUFFLGFBQWEsSUFBSSxhQUFuQixDQUFELEdBQXFDLElBQUksYUFEN0M7QUFFQSxvQkFBTSxpQkFDRixhQUFhLElBQUksYUFBakIsR0FBaUMsSUFBSSxhQUFKLEdBQW9CLEtBQUssRUFEOUQ7QUFFQSx1QkFBTyxtQkFDSCxLQUFLLEdBQUwsQ0FBUyxDQUFULEVBQVksS0FBSyxHQUFMLENBQVMsSUFBSSxhQUFiLEVBQTRCLGNBQTVCLENBQVosQ0FESjtBQUVEO0FBckJnQjs7QUFBQTtBQUFBO0FBQUEsQ0FBckIiLCJmaWxlIjoianMvYXBwL3BsYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gTWF5YmUgdGhyb3cgZXhlcHRpb24gaWYgdGhlcmUgaXMgbm8gc2lnbklEXHJcbi8vIFBsYXllciBjb25zdHJ1Y3RvclxyXG5kZWZpbmUoWycuL2NvbmZpZyddLCAoeyBnZW5lcmFsOiBjZmcsIGFpOiBhaUNmZyB9KSA9PlxyXG4gIGNsYXNzIFBsYXllciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoeyBzaWduSUQgPSAneCcsIGNvbG9yID0gJyM0NDQnLCBhaSA9ICdub25lJyB9LCBpZCkge1xyXG4gICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoaWQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKGBCYWQgcGxheWVyIElEOiAke2lkfWApO1xyXG4gICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICAgIHRoaXMuc2lnbklEID0gc2lnbklEO1xyXG4gICAgICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgICAgIHRoaXMuYWkgPSBhaUNmZ1thaV0gfHwgYWlDZmcubm9uZTtcclxuICAgICAgdGhpcy5pc1VzZXIgPSB0aGlzLmFpID09PSBhaUNmZy5ub25lO1xyXG4gICAgICB0aGlzLm1heFR1cm5zID0gdGhpcy5jb3VudFR1cm5zKGNmZy5tYXhUdXJucyk7XHJcbiAgICAgIE9iamVjdC5mcmVlemUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgY291bnRUdXJucyh0b3RhbFR1cm5zKSB7XHJcbiAgICAgIGNvbnN0IGVuZGVkUm91bmRzVHVybnMgPVxyXG4gICAgICAgICAgfn4odG90YWxUdXJucyAvIGNmZy50dXJuc1BlclJvdW5kKSAqIGNmZy5zaWduc1BlclJvdW5kO1xyXG4gICAgICBjb25zdCB0aGlzUm91bmRUdXJucyA9XHJcbiAgICAgICAgICB0b3RhbFR1cm5zICUgY2ZnLnR1cm5zUGVyUm91bmQgLSBjZmcuc2lnbnNQZXJSb3VuZCAqIHRoaXMuaWQ7XHJcbiAgICAgIHJldHVybiBlbmRlZFJvdW5kc1R1cm5zICtcclxuICAgICAgICAgIE1hdGgubWF4KDAsIE1hdGgubWluKGNmZy5zaWduc1BlclJvdW5kLCB0aGlzUm91bmRUdXJucykpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcbik7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
