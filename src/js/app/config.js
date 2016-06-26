// TODO Add ranges for settings
// TODO Setting randomizers is untested
// TODO Take settings from JSON
// Full config
define(() => {
  const players = [
    { sign: 0, ai: 'none', color: [238, 68, 68] },
    { sign: 1, ai: 'hard', color: [51, 85, 255] },
  ];

  const general = {
    defaultRowsCols: 3, emptyVal: 9,
    size: 420, rows: 5, columns: 5, signsPerRound: 1, winLength: 4,
    top: 20, right: 20, bottom: 20, left: 20,
  };

  general.maxLineLength = Math.min(general.rows, general.columns);
  general.maxTurns = general.rows * general.columns;
  general.turnsPerRound = players.length * general.signsPerRound;
  general.minTurnsForTie = Math.max(general.rows, general.columns) * 2;

  const elements = {
    line: {
      imgID: [[0, 1, 2, 3]],
      random: { move: 10, rotate: 0.08, scale: 0.08 },
      frames: { total: 6, inline: 1, fps: 30 },
      color: [0, 0, 0],
      pause: 160,
    },
    sign: {
      imgID: [[4], [5]],
      random: { move: 8, rotate: 0.12, scale: 0.1 },
      frames: { total: 1, inline: 1, fps: 30 },
      color: [0, 0, 0],
      pause: 200,
    },
  };

  const assets = {
    images: [
      'img/line-0.png', 'img/line-1.png', 'img/line-2.png',
      'img/line-3.png', 'img/sign-x-0.png', 'img/sign-o-0.png',
    ],
  };

  const ai = {
    none: {
      score: { sign: [0, 0, 0], win: 0, tie: 0 }, depth: 0, tolerance: 0,
    },
    hard: {
      score: { sign: [6, 5, 4], win: 100000, tie: 100 }, depth: 5, tolerance: 5,
    },
    normal: {
      score: { sign: [6, 5], win: 10000, tie: 50 }, depth: 3, tolerance: 10,
    },
    easy: {
      score: { sign: [5], win: 100, tie: 10 }, depth: 1, tolerance: 30,
    },
  };

  Object.keys(ai).forEach(p => {
    if (ai[p].score.sign.length < players.length) {
      const last = ai[p].score.sign.pop();
      ai[p].score.sign = ai[p].score.sign.concat(
          Array(players.length - ai[p].score.sign.length).fill(last));
    }
  });

  return { general, players, elements, assets, ai };
});
