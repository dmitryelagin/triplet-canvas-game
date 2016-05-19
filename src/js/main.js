$(document).ready(function() {
  var games = [];
  if (Modernizr.canvas) games.unshift(new TRIPLET.Game(games.length));
});
