const {
  concatenate,
  either,
} = require('./parserEnhancers');

const {
  not,
  empty,
} = require('../functional');

const eatWhile = predicate =>
  nodeList => {
    if (nodeList.length === 0) {
      return { recognized: [], remaining: [] };
    }

    const [node, ...nextNodes] = nodeList;

    if (predicate(node)) {
      const maybeSomeMore = eatWhile(predicate)(nextNodes);
      return {
        recognized: [node, ...maybeSomeMore.recognized],
        remaining: maybeSomeMore.remaining,
      };
    }

    return { recognized: [], remaining: nodeList };
  }
;

const applyTransform = transform => parser =>
  nodeList => {
    const { recognized, remaining } = parser(nodeList);
    return {
      recognized: not(empty)(recognized) ? transform(recognized) : recognized,
      remaining,
    };
  }
;

const transformAdjacent = (predicate, transform) =>
  concatenate(
    either(
      eatWhile(not(predicate)),
      applyTransform(transform)(
        eatWhile(predicate)
      )
    )
  )
;

module.exports = {
  eatWhile,
  transformAdjacent,
};
