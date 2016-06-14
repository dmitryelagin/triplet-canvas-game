// TODO Add RequireJS and maybe Modernizr
// TODO Add multi-game feature
import Game from './app/game';
import $ from './lib/jquery';  // May not work, should be tested

$(document).ready(() => {
  const games = [];
  games.unshift(new Game(games.length));
});
