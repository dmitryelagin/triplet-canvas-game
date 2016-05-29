// TODO Throw exeption if there is no signID
// TODO Clean constructor in the end
// TODO isUser flag and ai setup are ugly
// Player constructor
TRIPLET.Player = (function() {

var cfg = TRIPLET.config.general,
    rule = TRIPLET.config.rules,
    ai = TRIPLET.config.ai,
    Player;

Player = function(setup, index) {
  if (!(this instanceof Player)) return new Player(setup, index);
  this.queue = parseInt(index, 10);
  this.signID = setup.signID;
  this.name = setup.name || 'Player';
  this.color = setup.color || '000000';
  this.isUser = !setup.ai || setup.ai === 'none';
  this.ai = this.isUser ? ai.none : ai[setup.ai];
  this.maxTurns = this.getTurnsCount(cfg.maxTurns);
};

Player.prototype = {

  constructor: TRIPLET.Player,

  getTurnsCount: function(totalTurns) {
    var endedRoundsTurns =
            ~~(totalTurns / rule.turnsPerRound) * rule.signsPerRound,
        thisRoundTurns =
            totalTurns % rule.turnsPerRound - rule.signsPerRound * this.queue;
    return endedRoundsTurns +
        Math.max(0, Math.min(rule.signsPerRound, thisRoundTurns));
  }

};

return Player;

})();
