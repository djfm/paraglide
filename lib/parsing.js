/* eslint-disable */
const log = v => console.log(JSON.stringify(v, null, 2)) || v;
/* eslint-enable */

const compose = (...fns) => i => fns.reduce((x, f) => f(x), i);

const strToArray = str => (
  typeof str === 'string' ? str.split('') : str
);

const flatMap = fn => list => [].concat(...list.map(fn));

const flatMapArgs = fn =>
  (...args) => fn(...[].concat(...args.map(strToArray)));

// tag :: [value] -> tree
const tagValue = tag => flatMapArgs(
  (...nodes) => ({ tag, nodes })
);

const ok = tagValue({ recognized: true });
const ko = tagValue({ recognized: false });
const is = type => tagValue({ recognized: true, type });

// mapParser :: parser -> [value] -> { recognized, nodes }
// ????

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

const flattenNodes = parentTag =>
  compose(
    removeEmptyTrees,
    promoteValuesToTrees(parentTag)
  );

const flattenTree = ({ tag, nodes }) => ({
  tag,
  nodes: flattenNodes(tag)(nodes),
});

const makeParser = parserFn =>
  (...args) => flattenTree(flatMapArgs(parserFn)(...args));

const withParsers = fn => flatMapArgs(
  compose(fn, makeParser)
);

const charParser = c => makeParser(
  (value, ...values) => (
    value === c ?
      ok(value, ko(values)) :
      ok(value, values)
  )
);

const sequence = withParsers(
  (parser, ...parsers) => nodes => ko(nodes)
);

module.exports = {
  ok,
  ko,
  is,
  charParser,
  sequence,
};
