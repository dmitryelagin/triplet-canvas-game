// TODO Add multi-game feature
// TODO Babel Polyfill library is not needed in source
const requireCfg = {
  baseUrl: 'js/lib',
  paths: { app: '../app' },
};
require(requireCfg, ['jquery', 'app/game'], ($, Game) => {
  const games = [];
  games.unshift(new Game(games.length, requireCfg));
});
