const map = (object, fn) => {
  if (object instanceof Array) {
    return object.map(fn);
  } else if (typeof object === 'object') {
    const copy = {};
    for (const key of Object.keys(object)) {
      copy[key] = fn(object[key], key, object);
    }
    return copy;
  }

  return object;
};

const deepMap = (object, fn) =>
  fn(
    map(object, value => deepMap(value, fn))
  )
;

const compose = (...functions) =>
  firstInput => functions.reduce(
    (input, func) => func(input),
    firstInput
  )
;

module.exports = {
  compose,
  map,
  deepMap,
};
