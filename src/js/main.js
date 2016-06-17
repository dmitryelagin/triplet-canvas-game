// TODO Add multi-game feature
requirejs.config({
  baseUrl: 'js/lib',
  paths: { app: '../app' },
});

requirejs(['jquery', 'app/game'], ($, Game) => {
  const games = [];
  games.unshift(new Game(games.length));
});
