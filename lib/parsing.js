const repeat = (...definitions) => null;

const strToArray = str => {
  if (typeof str !== 'string') {
    return str;
  }
  return str.split('');
};

const flatMapArgs = fn =>
  (...args) => {
    const flatArgs = [].concat(...args.map(strToArray));
    if (flatArgs.length) {
      return fn(...flatArgs);
    }
    return [];
  };

const isTree = tree =>
  tree && (typeof(tree) === 'object') && tree.nodes;

const canAdoptRecognizedState = (oldRecognized, newRecognized) => {
  if (!oldRecognized && !newRecognized) {
    return { adopt: true, recognized: false };
  }

  if (oldRecognized === newRecognized) {
    return { adopt: true, recognized: newRecognized };
  }

  if (oldRecognized && newRecognized) {
    if (oldRecognized === true) {
      return { adopt: true, recognized: newRecognized };
    }

    if (newRecognized === true) {
      return { adopt: true, recognized: oldRecognized };
    }
  }

  return { adopt: false };
};

const takeWhile = predicate => right => {
  if (right.length === 0) {
    return { left: [], right: [] };
  }
  if (predicate(right[0])) {
    const next = takeWhile(predicate)(right.slice(1));
    return { left: [right[0], ...next.left], right: next.right };
  }
  return { left: [], right };
};

const groupByRecognized = trees => {
  if (trees.length < 2) {
    return trees;
  }

  const { left, right } = takeWhile(
    tree => (tree.recognized === trees[0].recognized)
  )(trees);

  const nextGroups = right.length ?
    groupByRecognized(right) :
    []
  ;

  return [{
    recognized: trees[0].recognized,
    nodes: [].concat(...left.map(({ nodes }) => nodes)),
  }, ...nextGroups];
};

const makeRecognizedTree = tagToApply =>
  flatMapArgs(
    (...nodes) => {
      const taggedNodes = nodes.map(n => (
        isTree(n) ?
          makeRecognizedTree(n.recognized)(n.nodes) :
          { recognized: tagToApply, nodes: [n] }
      ));

      const trees = groupByRecognized(taggedNodes);

      if (trees.length === 1) {
        const tree = trees[0];
        const { adopt, recognized } = canAdoptRecognizedState(
          tree.recognized, tagToApply
        );
        if (adopt) {
          return Object.assign({}, trees[0], { recognized });
        }
      }

      return {
        recognized: tagToApply,
        nodes: trees,
      };
    }
  );

const recognized = Object.assign(
  makeRecognizedTree(true),
  { withTag: makeRecognizedTree }
);

const unrecognized = makeRecognizedTree(false);

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
    const mappedTree = recognized.withTag(tree.recognized)(
      subMap.map(t => t.mappedTree)
    );
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
