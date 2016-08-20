const map = fn => iterable => Array.from(iterable).map(fn);

const isIterable = v =>
  v && (typeof v === 'object') && (Symbol.iterator in v);

const flatten = maybeIterable => (
  isIterable(maybeIterable) ?
    [].concat(...map(flatten)(maybeIterable)) :
    [maybeIterable]
);

const takeWhile = predicate => (...args) => {
  const take = items => {
    if (items.length === 0) {
      return [[], []];
    }

    const [head, ...tail] = items;

    if (predicate(head)) {
      const [matching, different] = take(tail);
      return [[head, ...matching], different];
    }

    return [[], items];
  };
  return take(flatten(args));
};

const same = a => b => {
  const includes = x => y => {
    if (typeof x !== 'object' || typeof y !== 'object') {
      return false;
    }
    for (const key of Object.keys(x)) {
      if (!same(x[key])(y[key])) {
        return false;
      }
    }
    return true;
  };

  if (typeof a !== typeof b) {
    return false;
  }
  if (a === b) {
    return true;
  }

  if (includes(a)(b) && includes(b)(a)) {
    return true;
  }

  return false;
};

const strToArray = str => (
  typeof str === 'string' ? str.split('') : str
);

const compose = (...fns) => i => fns.reduce((x, f) => f(x), i);

module.exports = {
  map,
  takeWhile,
  same,
  strToArray,
  compose,
  flatten,
};
