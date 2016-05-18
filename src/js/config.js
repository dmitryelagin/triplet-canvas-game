// TODO Enter config as JSON
// TODO Maybe merge general and rules
// TODO Use immediate object initialization pattern
// Full config
TRIPLET.config = (function() {

  var random = TRIPLET.utilities.random;

  function Randomizer(type, arg) {
    if (type in random) return random[type].bind(null, arg);
    else throw new Error('Wrong type of random function: ' + type);
  }

  var config = {

    general: {
      rows: 5, columns: 5, defaultRowsCols: 3, size: 420,
      top: 20, right: 20, bottom: 20, left: 20
    },

    rules: {
      emptyVal: 9, signsPerRound: 1, winLength: 4
    },

    players: [
      { name: 'Ann', ai: 'hard', signID: 0, color: 'ff0000' },
      { name: 'Bob', ai: 'none', signID: 1, color: '0000ff' }
    ],

    element: {
      line: {
        random: Object.defineProperties({}, {
          'imgID': { get: Randomizer('item', [0, 1, 2, 3]) },
          'move': { get: Randomizer('error', 8) },
          'rotate': { get: Randomizer('error', 0.1) },
          'scale': { get: Randomizer('error', 0.1) }
        }),
        frames: { inRow: 1, total: 6, delay: 25 },
        pause: 40
      },
      sign: {
        random: Object.defineProperties({}, {
          'imgID': {
            value: Object.defineProperties([], {
              '0': { get: Randomizer('item', [4]) },
              '1': { get: Randomizer('item', [5]) }
            })
          },
          'move': { get: Randomizer('error', 8) },
          'rotate': { get: Randomizer('error', 0.1) },
          'scale': { get: Randomizer('error', 0.1) }
        }),
        frames: { inRow: 1, total: 1, delay: 0 },
        pause: 200
      }
    },

    assets: {
      images: [
        'https://dl.dropboxusercontent.com/s/wzy9flotdl1ba74/line_0an.png',
        'https://dl.dropboxusercontent.com/s/gfe69iq6uwi4m4j/line_1an.png',
        'https://dl.dropboxusercontent.com/s/2m2w25o8l9hqguv/line_2an.png',
        'https://dl.dropboxusercontent.com/s/gzkhrchd9vmfcqk/line_3an.png',
        'https://dl.dropboxusercontent.com/s/wecnycckk5c3rij/signx_0.png',
        'https://dl.dropboxusercontent.com/s/jfzgiqfaxe8q9al/signo_0.png'
      ]
    },

    ai: {
      none: {
        score: {
          sign: { own: 0, enemy: 0, mainEnemy: 0 }, win: 0, tie: 0
        }, depth: 0, infelicity: 0
      },
      hard: {
        score: {
          sign: { own: 6, enemy: 4, mainEnemy: 5 }, win: 100000, tie: 100
        }, depth: 4, infelicity: 2
      },
      normal: {
        score: {
          sign: { own: 5, enemy: 5, mainEnemy: 5 }, win: 10000, tie: 50
        }, depth: 1, infelicity: 5
      },
      easy: {
        score: {
          sign: { own: 5, enemy: 5, mainEnemy: 5 }, win: 100, tie: 10
        }, depth: 0, infelicity: 30
      }
    }

  };

  (function(cfg) {
    cfg.maxLineLength = Math.min(cfg.rows, cfg.columns);
    cfg.maxTurns = cfg.rows * cfg.columns;
  })(config.general);

  (function(cfg) {
    cfg.turnsPerRound = config.players.length * cfg.signsPerRound;
  })(config.rules);

  return config;

})();
