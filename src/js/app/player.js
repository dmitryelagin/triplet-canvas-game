// TODO Maybe throw exeption if there is no signID
// Player constructor
define(['./config'], ({ general: cfg, ai: aiCfg }) =>
  class Player {

    constructor({ signImg = 'x', color = '#444', ai = 'none' }, id) {
      if (!Number.isInteger(id)) throw new TypeError(`Bad player ID: ${id}`);
      this.id = id;
      this.signImg = signImg;
      this.color = color;
      this.ai = aiCfg[ai] || aiCfg.none;
      this.isUser = this.ai === aiCfg.none;
      this.maxTurns = this.countTurns(cfg.maxTurns);
      Object.freeze(this);
    }

    countTurns(totalTurns) {
      const endedRoundsTurns =
          ~~(totalTurns / cfg.turnsPerRound) * cfg.signsPerRound;
      const thisRoundTurns =
          totalTurns % cfg.turnsPerRound - cfg.signsPerRound * this.id;
      return endedRoundsTurns +
          Math.max(0, Math.min(cfg.signsPerRound, thisRoundTurns));
    }

  }
);
