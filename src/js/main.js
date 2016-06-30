// TODO Add multi-game feature
const requireCfg = {
  baseUrl: 'js/lib',
  paths: { app: '../app' },
};
require(requireCfg, ['jquery', 'app/game'], ($, Game) => {
  const games = [];
  games.unshift(new Game(games.length, requireCfg));
});
