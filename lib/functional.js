const equals = expectedValue =>
  actualValue => actualValue === expectedValue
;

const empty = iterable =>
  iterable[Symbol.iterator]().next().done
;

const not = predicate =>
  (...predicateArgs) => !predicate(...predicateArgs)
;

const noneOf = (...predicates) =>
  (...predicateArgs) => {
    for (const predicate of predicates) {
      if (predicate(...predicateArgs)) {
        return false;
      }
    }

    return true;
  }
;

const lazyly = fnToCallLater => (...argsForThatFunction) =>
  (...args) => fnToCallLater(...argsForThatFunction)(...args)
;

module.exports = {
  equals,
  empty,
  not,
  lazyly,
  noneOf,
};
