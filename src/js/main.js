// TODO Do not use modernizr if canvas generated with innerHTML
$(document).ready(function() {
  var games = [];
  if (Modernizr.canvas) games.unshift(new TRIPLET.Game());
});
