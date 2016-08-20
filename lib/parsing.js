const {
  takeWhile,
  flatten,
  same,
  compose,
  flatMap,
  flatMapArgs,
} = require('./functional');

/* eslint-disable */
const log = v => console.log(JSON.stringify(v, null, 2)) || v;
/* eslint-enable */

// tag :: [value] -> tree
const tagValue = tag => flatMapArgs(
  (...nodes) => ({ tag, nodes })
);

const ok = tagValue({ recognized: true });
const ko = tagValue({ recognized: false });
const is = type => tagValue({ recognized: true, type });

const isTree = node => (typeof node === 'object' && 'nodes' in node);

const removeEmptyTrees = flatMap(
  node => (
    isTree(node) && node.nodes.length === 0 ? [] : node
  )
);

const promoteValuesToTrees = parentTag => flatMap(
  node => (
    !isTree(node) ? tagValue(parentTag)(node) : node
  )
);

const mergeTreesWithSameTag = nodes => {
  if (nodes.length === 0) {
    return [];
  }

  const [tree, ...trees] = nodes;

  if (trees.length === 0) {
    return [tree];
  }

  const [sameTag, differentTag] = takeWhile(
    ({ tag }) => same(tag)(tree.tag)
  )(trees);

  return [{
    tag: tree.tag,
    nodes: [
      ...tree.nodes,
      ...flatten(sameTag.map(t => t.nodes)),
    ],
  }, ...mergeTreesWithSameTag(differentTag)];
};

const flattenNodes = parentTag =>
  compose(
    removeEmptyTrees,
    promoteValuesToTrees(parentTag),
    mergeTreesWithSameTag
  );

const flattenTree = ({ tag, nodes }) => ({
  tag,
  nodes: flattenNodes(tag)(nodes),
});

const makeParser = parserFn =>
  (...args) => flattenTree(flatMapArgs(parserFn)(...args));

const withParsers = fn => flatMapArgs(
  (...parsers) => flatMapArgs(
    (...nodes) => makeParser(fn(...parsers))(...nodes)
  )
);

const charParser = c => makeParser(
  (value, ...values) => (
    value === c ?
      ok(value, ko(values)) :
      ok(value, values)
  )
);

const sequence = withParsers(
  (parser, ...parsers) => (...nodes) => {
    const result = parser(nodes);
    if (parsers.length === 0 || !result.tag.recognized) {
      return result;
    }
    const restOfSequence = result.nodes.reduce(
      ({ newNodes, recognizedCount }, tree) => {
        if (tree.tag.recognized) {
          return {
            newNodes: newNodes.concat(tree),
            recognizedCount,
          };
        }
        const restResult = sequence(parsers)(tree.nodes);
        return {
          newNodes: newNodes.concat(restResult.nodes),
          recognizedCount: restResult.tag.recognized ?
            recognizedCount + 1 :
            recognizedCount,
        };
      },
      { newNodes: [], recognizedCount: 0 }
    );

    if (restOfSequence.recognizedCount === parsers.length) {
      return ok(restOfSequence.newNodes);
    }

    return ko(nodes);
  }
);

module.exports = {
  ok,
  ko,
  is,
  charParser,
  sequence,
};
