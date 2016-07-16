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

/**
 * Turns a function of type (a, a) => a into
 * a function of type (...a) => a.
 *
 * It makes sense only if the function is a left associative
 * binary operator.
 *
 * The resulting, lifted function cannot be called with less than 2 arguments.
 */
const liftLeftAssociativeBinary = func => {
  const lifted = (firstArg, secondArg, ...remainingArgs) => {
    if (secondArg === undefined) {
      throw new Error(
        'liftLeftAssociativeBinary: lifted function called with too few args'
      );
    }

    if (empty(remainingArgs)) {
      return func(firstArg, secondArg);
    }
    return lifted(func(firstArg, secondArg), ...remainingArgs);
  };

  return lifted;
};

module.exports = {
  equals,
  empty,
  not,
  lazyly,
  noneOf,
  liftLeftAssociativeBinary,
};
