// TODO Add multi-game feature
requirejs.config({
  baseUrl: 'js/lib',
  paths: { app: '../app' },
});

requirejs(['jquery', 'app/game'], ($, Game) => {
  const games = [];
  games.unshift(new Game(games.length));
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcy9tYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gQWRkIG11bHRpLWdhbWUgZmVhdHVyZVxyXG5yZXF1aXJlanMuY29uZmlnKHtcclxuICBiYXNlVXJsOiAnanMvbGliJyxcclxuICBwYXRoczogeyBhcHA6ICcuLi9hcHAnIH0sXHJcbn0pO1xyXG5cclxucmVxdWlyZWpzKFsnanF1ZXJ5JywgJ2FwcC9nYW1lJ10sICgkLCBHYW1lKSA9PiB7XHJcbiAgY29uc3QgZ2FtZXMgPSBbXTtcclxuICBnYW1lcy51bnNoaWZ0KG5ldyBHYW1lKGdhbWVzLmxlbmd0aCkpO1xyXG59KTtcclxuIl0sImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
