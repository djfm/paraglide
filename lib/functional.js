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

const identity = anything => anything;

const hasProperty = (key, value) =>
  object => object[key] === value
;

const selectProperty = property =>
  object => object[property]
;

const not = predicate =>
  (...args) => !predicate(...args)
;

const empty = iterable =>
  iterable[Symbol.iterator]().next().done
;

module.exports = {
  compose,
  map,
  deepMap,
  identity,
  hasProperty,
  selectProperty,
  not,
  empty,
};
