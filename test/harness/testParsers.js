/**
 * Returns a parser that matches the provided char.
 * nodeList is expected to be an iterable of chars.
 */

const parseChar = c =>
  nodeList => {
    const [currentChar, ...remaining] = nodeList;
    if (currentChar === c) {
      return {
        recognized: [currentChar],
        remaining,
      };
    }
    return {
      recognized: [],
      remaining: nodeList,
    };
  }
;

module.exports = {
  parseChar,
};
