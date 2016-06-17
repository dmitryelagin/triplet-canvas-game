// TODO Add ranges for settings
// TODO Setting randomizers is untested
// TODO Some values are changed for test, revert them later
// Full config
define(['./utilities'], ({ random }) => {
  const general = {
    defaultRowsCols: 3, emptyVal: 9,
    size: 420, rows: 5, columns: 5, signsPerRound: 1, winLength: 4,
    top: 20, right: 20, bottom: 20, left: 20,
  };

  const players = [
    { name: 'Alice', ai: 'none', signID: 'x', color: '#e44' },
    { name: 'Bob', ai: 'hard', signID: 'o', color: '#35f' },
  ];

  general.maxLineLength = Math.min(general.rows, general.columns);
  general.maxTurns = general.rows * general.columns;
  general.turnsPerRound = players.length * general.signsPerRound;
  general.minTurnsForTie = Math.max(general.rows, general.columns) * 2;

  const elements = {
    line: {
      random: {
        imgID: [0, 1, 2, 3],
        move: 10, rotate: 0.08, scale: 0.08,
      },
      frames: { inRow: 1, total: 6, delay: 30 },  // delay 36
      color: '#000',
      pause: 120,  // pause 160
    },
    sign: {
      random: {
        imgID: { x: [4], o: [5] },
        move: 8, rotate: 0.12, scale: 0.1,
      },
      frames: { inRow: 1, total: 1, delay: 0 },
      color: '#000',
      pause: 200,
    },
  };

  function makeRandomizers(obj) {
    function remakeObj(property, val) {
      Object.defineProperty(obj, property, {
        enumerable: true,
        get: random.makeRandomizer(val),
        set: remakeObj.bind(null, property),
      });
    }
    Object.keys(obj).forEach(prop => {
      if (typeof obj[prop] === 'object' && !Array.isArray(obj[prop])) {
        makeRandomizers(obj[prop]);
      } else {
        remakeObj(prop, obj[prop]);
      }
    });
  }

  makeRandomizers(elements.line.random);
  makeRandomizers(elements.sign.random);

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
