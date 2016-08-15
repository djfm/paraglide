const sequence = (...definitions) => null;
const repeat = (...definitions) => null;

const strToArray = str => {
  if (typeof str !== 'string') {
    return str;
  }
  return str.split('');
};

const flatMapArgs = fn =>
  (...args) => fn(...[].concat(...args.map(strToArray)));

const patchState = transformState =>
  (state, ...args) => Object.assign(
    {}, state, transformState(state, ...args)
  );

const isTree = tree =>
  tree && (typeof(tree) === 'object') && tree.nodes;

const withTree = fn => tree => (
  isTree(tree) ? fn(tree) : tree
);

const flattenTree = withTree(
  tree => {
    const flatTree = tree.nodes.reduce(
      patchState(
        (state, node) => {
          if (!isTree(node)) {
            return { nodes: state.nodes.concat(node) };
          }

          if (node.nodes.length === 0) {
            return state;
          }

          const flatNode = flattenTree(node);
          if (flatNode.recognized === state.recognized) {
            return { nodes: state.nodes.concat(flatNode.nodes) };
          }

          return {
            recognized: flatNode.recognized,
            nodes: flatNode.nodes,
            trees: state.trees.concat({
              recognized: state.recognized,
              nodes: state.nodes,
            }),
          };
        }
      ),
      { recognized: tree.recognized, nodes: [], trees: [] }
    );

    const lastTree = {
      recognized: flatTree.recognized,
      nodes: flatTree.nodes,
    };

    if (flatTree.trees.length === 0) {
      return lastTree;
    }

    return {
      recognized: tree.recognized,
      nodes: [...flatTree.trees, lastTree],
    };
  }
);

const nodesToTree = fn => flatMapArgs(
  (...nodes) => flattenTree(fn(...nodes))
);

const recognized = nodesToTree((...nodes) =>
  ({ recognized: true, nodes }));

const unrecognized = nodesToTree((...nodes) =>
  ({ recognized: false, nodes }));

const charParser = charToParse => flatMapArgs(
  (node, ...nextNodes) => {
    if (node === charToParse) {
      return recognized(recognized(node), unrecognized(nextNodes));
    }
    return unrecognized(node, nextNodes);
  });

const coerceToParsers = preParser => {
  if (typeof preParser === 'function') {
    return preParser;
  }

  if (typeof preParser === 'string') {
    return preParser.split('').map(charParser);
  }

  throw new TypeError(`"${preParser}" cannot be converted to parsers.`);
};

const withParsers = fnOfParsers =>
  flatMapArgs(
    (...preParsers) => flatMapArgs(fnOfParsers)(
      ...preParsers.map(coerceToParsers)
    )
  );

const first = withParsers(
  (parser, ...nextParsers) => nodes => {
    if (!parser) {
      return unrecognized(nodes);
    }
    const parseResult = parser(nodes);
    if (parseResult.recognized) {
      return parseResult;
    }
    return first(nextParsers)(nodes);
  }
);


module.exports = {
  sequence,
  first,
  repeat,
};
