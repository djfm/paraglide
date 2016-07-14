/**
 * Transforms a parser into a parser that
 * is recursively called on its own remaining nodes,
 * concatenating all results.
 * Kind of like the "*" operator in regular expressions.
 */

const concatenate = parser =>
  nodeList => {
    const { recognized, remaining } = parser(nodeList);

    if (remaining.length > 0) {
      return {
        recognized: [...recognized, ...concatenate(parser)(remaining).recognized],
        remaining: [],
      };
    }

    return { recognized, remaining };
  }
;

/**
 * Transforms a list of parser into a parser
 * that returns the result of the first parser that
 * recognized something.
 */

const either = (...parsers) =>
  nodeList => {
    for (const parser of parsers) {
      const maybeParsed = parser(nodeList);
      if (maybeParsed.recognized.length > 0) {
        return maybeParsed;
      }
    }
    return { recognized: [], remaining: [] };
  }
;

module.exports = {
  concatenate,
  either,
};
