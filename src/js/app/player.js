// TODO Maybe throw exeption if there is no signID
// Player constructor
import { general as cfg, ai as aiCfg } from './config';

export default class Player {

  constructor({ signImg = 'x', color = '#444', ai = 'none' }, id) {
    if (!Number.isInteger(id)) throw new TypeError(`Bad player ID: ${id}`);
    this.queue = id;
    this.signImg = signImg;
    this.color = color;
    this.ai = aiCfg[ai] || aiCfg.none;
    this.isUser = this.ai === aiCfg.none;
    this.maxTurns = this.getTurnsCount(cfg.maxTurns);
    Object.freeze(this);
  }

  getTurnsCount(totalTurns) {
    const endedRoundsTurns =
            ~~(totalTurns / cfg.turnsPerRound) * cfg.signsPerRound;
    const thisRoundTurns =
            totalTurns % cfg.turnsPerRound - cfg.signsPerRound * this.queue;
    return endedRoundsTurns +
        Math.max(0, Math.min(cfg.signsPerRound, thisRoundTurns));
  }

}
