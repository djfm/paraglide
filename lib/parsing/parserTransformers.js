/**
 * "parserTransformer"s are functions
 * that accept some arguments, then a parser in curry style,
 * and return a new parser.
 */

const {
  empty,
} = require('../functional');

const applyToRecognized = transform => parser =>
  nodeList => {
    const { recognized, remaining } = parser(nodeList);

    if (empty(recognized)) {
      return { recognized, remaining: [...remaining] };
    }

    return {
      recognized: transform(recognized),
      remaining,
    };
  }
;

const ifNextNodeMatches = predicate => parser =>
  nodeList => {
    const [node] = nodeList;

    if (predicate(node)) {
      return parser(nodeList);
    }

    return {
      recognized: [],
      remaining: [...nodeList],
    };
  }
;

module.exports = {
  applyToRecognized,
  ifNextNodeMatches,
};
