/**
 * "parserTransformer"s are functions
 * that accept some arguments, then a parser in curry style,
 * and return a new parser.
 */

const applyToRecognized = transform => parser =>
  nodeList => {
    const { recognized, remaining } = parser(nodeList);
    return {
      recognized: transform(recognized),
      remaining,
    };
  }
;

module.exports = {
  applyToRecognized,
};
