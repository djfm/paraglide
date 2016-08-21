const {
  takeWhile,
  flatten,
  same,
  compose,
  flatMap,
  flatMapArgs,
} = require('./functional');

/* eslint-disable */
const log = (v, ...header) =>
  console.log(...header, JSON.stringify(v, null, 2)) || v;
/* eslint-enable */

// tag :: [value] -> tree
const tagValue = tag => flatMapArgs(
  (...nodes) => ({ tag, nodes })
);

const ok = tagValue({ recognized: true });
const ko = tagValue({ recognized: false });

const isTree = node => (typeof node === 'object' && 'nodes' in node);

const removeEmptyTrees = flatMap(node => (
  (isTree(node) && node.nodes.length === 0) ? [] : node
));

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

const charParser = c => makeParser(
  (value, ...values) => (
    value === c ?
      ok(value, ko(values)) :
      ko(value, values)
  )
);

const promoteToParser = maybeStr => (
  typeof maybeStr === 'string' ?
    charParser(maybeStr) :
    maybeStr
);

const combineParsers = fn => flatMapArgs(
  (...parsers) => flatMapArgs(
    (...nodes) =>
      makeParser(fn(...parsers.map(promoteToParser)))(...nodes)
  )
);

const sequence = combineParsers(
  (parser, ...parsers) => (...nodes) => {
    const result = parser(nodes);

    if (parsers.length === 0 || !result.tag.recognized) {
      return result;
    }

    const restOfSequence = result.nodes.reduce(
      ({ newNodes, recognizedCount, triedCount }, tree) => {
        if (tree.tag.recognized) {
          return {
            newNodes: newNodes.concat(tree),
            recognizedCount, triedCount,
          };
        }
        const restResult = sequence(parsers)(tree.nodes);
        return {
          newNodes: newNodes.concat(restResult.nodes),
          recognizedCount: restResult.tag.recognized ?
            recognizedCount + 1 :
            recognizedCount,
          triedCount: triedCount + 1,
        };
      },
      { newNodes: [], recognizedCount: 0, triedCount: 0 }
    );

    if (restOfSequence.triedCount > 0) {
      if (restOfSequence.recognizedCount === restOfSequence.triedCount) {
        return ok(restOfSequence.newNodes);
      }
    }

    if (restOfSequence.triedCount === 0) {
      /**
       * This is to let optional parsers
       * match the end of input.
       */
      const { tag: { recognized } } = sequence(parsers)();
      if (recognized) {
        /**
         * We return the result of the first parser
         * because when there is no input, then
         * we know the next parsers cannot have
         * created nodes.
         */
        return result;
      }
    }

    return ko(nodes);
  }
);

const sequenceIfMany = fn =>
  combineParsers(
    (...parsers) => fn(
      parsers.length === 1 ?
        parsers[0] :
        sequence(parsers)
    )
  );

const first = combineParsers(
  (parser, ...parsers) => (...nodes) => {
    const result = parser(nodes);
    if (result.tag.recognized) {
      return result;
    }
    if (parsers.length === 0) {
      return ko(nodes);
    }
    return first(parsers)(nodes);
  }
);

const addType = type => node => {
  if (node.tag.type && node.tag.type !== type) {
    return {
      tag: { recognized: true, type },
      nodes: [node],
    };
  }

  return {
    tag: { recognized: true, type },
    nodes: node.nodes,
  };
};

const tag = type => combineParsers(
  sequenceIfMany(
    parser => (...nodes) => {
      const result = parser(nodes);

      if (!result.tag.recognized) {
        return result;
      }

      return {
        tag: { recognized: true },
        nodes: result.nodes.map(
          node => (
            node.tag.recognized ?
              addType(type)(node) :
              node
          )
        ),
      };
    }
  )
);

const optional = (...parsers) => first(
  ...parsers,
  (...nodes) => ok(ko(nodes))
);

const oneOrMore = combineParsers(
  sequenceIfMany(
    parser => sequence(
      parser,
      optional(oneOrMore(parser))
    )
  )
);

module.exports = {
  ok,
  ko,
  charParser,
  sequence,
  first,
  tag,
  optional,
  oneOrMore,
  isTree,
};
