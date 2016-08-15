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

          if (state.recognized === flatNode.recognized) {
            return { nodes: state.nodes.concat(flatNode.nodes) };
          }

          if (state.recognized === true && flatNode.recognized) {
            return {
              recognized: flatNode.recognized,
              nodes: state.nodes.concat(flatNode.nodes),
            };
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

const makeRecognizedTree = tagToApply =>
  nodesToTree((...nodes) => ({ recognized: tagToApply, nodes }));

const recognized = Object.assign(
  makeRecognizedTree(true),
  { withTag: makeRecognizedTree }
);

const unrecognized = nodesToTree((...nodes) =>
  ({ recognized: false, nodes }));

const parser = fn =>
  options => flatMapArgs(fn(options));

const charParser = charToParse =>
  parser(
    options => (node, ...nextNodes) => (
      (node === charToParse) ?
        recognized(
          recognized.withTag(options.tag)(node),
          unrecognized(nextNodes)
        ) :
        unrecognized(node, nextNodes)
    )
  );

const coerceToParser = preParser => {
  if (typeof preParser === 'function') {
    return preParser;
  }

  if (typeof preParser === 'string') {
    if (preParser.length !== 1) {
      throw new TypeError(
        `The string "${preParser}" could not be converted ` +
        'to a parser because it is not of length 1.'
      );
    }
    return charParser(preParser);
  }

  throw new TypeError(`"${preParser}" cannot be converted to parsers.`);
};

const coerceToParsers = preParser => {
  if (typeof preParser === 'function') {
    return preParser;
  }

  if (typeof preParser === 'string') {
    return preParser.split('').map(charParser);
  }

  throw new TypeError(`"${preParser}" cannot be converted to parsers.`);
};

const withParser = fnOfParser =>
  (preParser, ...args) => fnOfParser(coerceToParser(preParser), ...args);

const withParsers = fnOfParsers =>
  flatMapArgs(
    (...preParsers) => flatMapArgs(fnOfParsers)(
      ...preParsers.map(coerceToParsers)
    )
  );

const mapUnrecognized = parserWithOptions => tree => {
  if (!isTree(tree)) {
    return { mappedTree: tree, trees: [] };
  }

  if (tree.recognized) {
    const subMap = tree.nodes.map(mapUnrecognized(parserWithOptions));
    const mappedTree = flattenTree({
      recognized: tree.recognized,
      nodes: subMap.map(t => t.mappedTree),
    });
    const trees = [].concat(...subMap.map(t => t.trees));

    return { mappedTree, trees };
  }

  const mappedTree = parserWithOptions(tree.nodes);
  return {
    mappedTree,
    trees: [mappedTree],
  };
};

const first = null;

const sequence = withParsers(
  (firstParser, ...nextParsers) => options => nodes => {
    const tree = firstParser(options)(nodes);

    if (nextParsers.length === 0) {
      return tree;
    }

    if (tree.recognized) {
      const { mappedTree, trees } = mapUnrecognized(
        sequence(nextParsers)(options)
      )(tree);
      if (!trees.some(t => !t.recognized)) {
        return recognized(mappedTree);
      }
    }
    return unrecognized(nodes);
  }
);

const tag = tagToApply => withParser(
  parserToEnhance =>
    options =>
      parserToEnhance(Object.assign({}, options, {
        tag: tagToApply,
      }))
);

const runParser = parserToRun =>
  nodes => parserToRun({ tag: true })(nodes);

module.exports = {
  sequence,
  first,
  repeat,
  charParser,
  tag,
  runParser,
};
