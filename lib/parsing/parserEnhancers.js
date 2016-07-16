/**
 * "parserEnhancer"s are functions that take one or more parsers and return a parser.
 *
 * When accepting several parsers, they are expected to be provided as
 * individual arguments rather than an array, because it makes the syntax
 * much more elegant.
 */

const {
  not,
  empty,
  lazyly,
} = require('../functional');

const ParseError = require('./ParseError');

const chainTwoParsers = (parser, next) =>
  nodeList => {
    if (empty(nodeList)) {
      return { recognized: [], remaining: [] };
    }

    const { recognized, remaining } = parser(nodeList);

    if (empty(recognized)) {
      return { recognized: [], remaining: [...remaining] };
    }

    const {
      recognized: nextRecognized,
      remaining: nextRemaining,
    } = next(remaining);

    return {
      recognized: [...recognized, ...nextRecognized],
      remaining: nextRemaining,
    };
  }
;

const identityParser = nodeList => ({
  recognized: [],
  remaining: [...nodeList],
});

const sequence = (...parsers) => {
  const [firstParser, nextParser, ...remainingParsers] = parsers;

  if (!firstParser) {
    return identityParser;
  }

  if (!nextParser) {
    return firstParser;
  }

  return sequence(
    chainTwoParsers(firstParser, nextParser),
    ...remainingParsers
  );
};

const zeroOrMore = parser => sequence(
  parser,
  lazyly(zeroOrMore)(parser)
);

const first = (...parsers) =>
  nodeList => {
    if (empty(nodeList)) {
      return { recognized: [], remaining: [] };
    }

    if (empty(parsers)) {
      return { recognized: [], remaining: [...nodeList] };
    }

    const [parser, ...nextParsers] = parsers;

    const {
      recognized,
      remaining,
    } = parser(nodeList);

    if (not(empty)(recognized)) {
      return { recognized, remaining };
    }

    return first(...nextParsers)(nodeList);
  }
;

const allowFailure = parser =>
  nodeList => {
    try {
      return parser(nodeList);
    } catch (e) {
      if (e instanceof ParseError) {
        return { recognized: [], remaining: [...nodeList] };
      }
      throw e;
    }
  }
;

module.exports = {
  zeroOrMore,
  sequence,
  first,
  allowFailure,
};
