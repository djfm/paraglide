/**
 * "parserEnhancer"s are functions that take one or more parsers and return a parser.
 *
 * When accepting several parsers, they are expected to be provided as
 * individual arguments rather than an array, because it makes the syntax
 * much more elegant.
 */

const {
  empty,
  lazyly,
  liftLeftAssociativeBinary,
} = require('../functional');

/**
 * This creates a function that returns a function
 * that composes (or not!) two parsers.
 *
 * When composition happens the second parser is called on
 * what the first parser did not recognize.
 *
 * The first argument to "chainTwoParsers" is a function
 * that takes the output of the first parser and either:
 * - returns a { recognized, remaining } of its choice,
 *   in which case the second parser is not called
 * - returns something falsey,
 *   in which case the second parser is called
 */
const chainTwoParsers = cancelTheChain =>
  (firstParser, nextParser) =>
    nodeList => {
      const { recognized, remaining } = firstParser(nodeList);

      const maybeCancelled = cancelTheChain({ recognized, remaining });
      if (maybeCancelled) {
        return maybeCancelled;
      }

      const {
        recognized: nextRecognized,
        remaining: nextRemaining,
      } = nextParser(remaining);

      return {
        recognized: [...recognized, ...nextRecognized],
        remaining: nextRemaining,
      };
    }
;

const callNextParserUnconditionally = chainTwoParsers(() => false);

const sequence = liftLeftAssociativeBinary(callNextParserUnconditionally);

const callNextParserIfFirstRecognizesSomething = chainTwoParsers(
  ({ recognized, remaining }) => {
    if (empty(recognized)) {
      return { recognized, remaining: [...remaining] };
    }
    return false;
  }
);

const sequenceWhileRecognize = liftLeftAssociativeBinary(
  callNextParserIfFirstRecognizesSomething
);

const zeroOrMore = parser =>
  sequenceWhileRecognize(
    parser,
    lazyly(zeroOrMore)(parser)
  )
;

module.exports = {
  zeroOrMore,
  sequence,
  sequenceWhileRecognize,
};
