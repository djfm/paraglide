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
} = require('../functional');

const ParseError = require('./ParseError');

const zeroOrMore = parser =>
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
    } = zeroOrMore(parser)(remaining);

    return {
      recognized: [...recognized, ...nextRecognized],
      remaining: nextRemaining,
    };
  }
;

const sequence = (...parsers) =>
  nodeList => {
    if (empty(parsers)) {
      return { recognized: [], remaining: [...nodeList] };
    }

    const [parser, ...nextParsers] = parsers;
    const { recognized, remaining } = parser(nodeList);

    if (empty(remaining)) {
      return { recognized, remaining };
    }

    const {
      recognized: nextRecognized,
      remaining: nextRemaining,
    } = sequence(...nextParsers)(remaining);

    return {
      recognized: [...recognized, ...nextRecognized],
      remaining: nextRemaining,
    };
  }
;

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
