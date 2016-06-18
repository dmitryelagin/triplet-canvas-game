// TODO Add multi-game feature
const requireCfg = {
  baseUrl: 'js/lib',
  paths: { app: '../app' },
};
requirejs(requireCfg, ['jquery', 'app/game'], ($, Game) => {
  const games = [];
  games.unshift(new Game(games.length, requireCfg));
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcy9tYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gQWRkIG11bHRpLWdhbWUgZmVhdHVyZVxyXG5jb25zdCByZXF1aXJlQ2ZnID0ge1xyXG4gIGJhc2VVcmw6ICdqcy9saWInLFxyXG4gIHBhdGhzOiB7IGFwcDogJy4uL2FwcCcgfSxcclxufTtcclxucmVxdWlyZWpzKHJlcXVpcmVDZmcsIFsnanF1ZXJ5JywgJ2FwcC9nYW1lJ10sICgkLCBHYW1lKSA9PiB7XHJcbiAgY29uc3QgZ2FtZXMgPSBbXTtcclxuICBnYW1lcy51bnNoaWZ0KG5ldyBHYW1lKGdhbWVzLmxlbmd0aCwgcmVxdWlyZUNmZykpO1xyXG59KTtcclxuIl0sImZpbGUiOiJqcy9tYWluLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
