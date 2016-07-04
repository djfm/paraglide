const { compose } = require('./functional');
const stdlib = require('./stdlib');

const stringToNodeList = string =>
  string
    .split('')
    .reduce(({ nodes, context }, sourceString) => ({
      nodes: nodes.concat({
        type: 'sourceString',
        value: sourceString,
        pos: {
          lineNumber: context.lineNumber,
          colNumber: context.colNumber,
        },
      }),
      context: Object.assign({}, context, {
        lineNumber: sourceString === '\n' ?
          context.lineNumber + 1 :
          context.lineNumber,
        colNumber: sourceString === '\n' ?
          1 :
          context.colNumber + 1,
      }),
    }), {
      nodes: [],
      context: {
        lineNumber: 1,
        colNumber: 1,
      },
    })
    .nodes
;

const composeParsers = compose;

const mergeAdjacent = nodeType => nodeList => {
  const newNodeList = [];

  const makeDefaultNode = () => ({
    type: nodeType,
    children: [],
  });

  let currentNode = null;

  const acceptCurrentNode = () => {
    if (currentNode !== null) {
      currentNode.value = currentNode
        .children
        .map(
          ({ value }) => value
        )
        .join('')
      ;
      newNodeList.push(currentNode);
    }
    currentNode = null;
  };

  for (const node of nodeList) {
    if (node.type === nodeType) {
      if (currentNode === null) {
        currentNode = makeDefaultNode();
      }
      currentNode.children.push(node);
    } else {
      acceptCurrentNode();
      newNodeList.push(node);
    }
  }
  acceptCurrentNode();
  return newNodeList;
};

const ensureSingleNode = nodeList => {
  if (nodeList.length !== 1) {
    throw new Error('Parsing incomplete.');
  }
  return nodeList[0];
};

const tokenize = nodeList => nodeList.map(
  node => {
    const definitions = [
      { exp: /^\d+(?:\.\d+)?$/, type: 'number' },
      { exp: /^[+\-*\/^:]|=>|=$/, type: 'operator' },
    ];

    for (const { exp, type } of definitions) {
      if (node.value.match && node.value.match(exp)) {
        return Object.assign({}, node, {
          value: node.value,
          type,
        });
      }
    }
    return node;
  }
);

const tag = (exp, nodeType) => nodeList => nodeList.map(
  node => ((node.value.match && node.value.match(exp)) ?
    Object.assign({}, node, { type: nodeType }) :
    node)
);

const remove = nodeType => nodeList => nodeList.reduce(
  (updatedList, node) =>
    (node.type === nodeType ? updatedList : updatedList.concat(node)),
  []
);

const groupBetween = (startExp, endExp, nodeType) => nodeList => {
  let currentGroup = null;

  const newNodeList = [];

  for (const node of nodeList) {
    if (node.value.match(startExp)) {
      if (currentGroup === null) {
        currentGroup = [];
      }
      currentGroup.push(node);
    } else if (node.value.match(endExp)) {
      newNodeList.push({
        type: nodeType,
        children: currentGroup.concat(node),
        value: currentGroup.slice(1),
      });
      currentGroup = null;
    } else {
      if (currentGroup) {
        currentGroup.push(node);
      } else {
        newNodeList.push(node);
      }
    }
  }

  return newNodeList;
};

const groupParens = groupBetween(/^\($/, /^\)$/, 'parenGroup');

const recursively = parser => nodeList =>
  parser(nodeList.map(node => (node.value instanceof Array ?
    Object.assign({}, node, { value: recursively(parser)(node.value) }) :
    node
  )))
;

const repeat = parser => nodeList => {
  const initialLength = nodeList.length;
  const newNodeList = parser(nodeList);
  if (newNodeList.length < initialLength) {
    return repeat(parser)(newNodeList);
  }
  return newNodeList;
};

const upgradeTypes = nodeList => nodeList.map(
  node => {
    if (node.type === 'number') {
      return Object.assign({}, node, {
        type: ['number'],
        value: +node.value,
      });
    }

    if (node.type === 'operator') {
      return Object.assign({}, node, stdlib[node.value]);
    }

    if (node.type === 'application') {
      return Object.assign({}, node, {
        type: node.value[0].type.slice(node.children.length - 1),
      });
    }

    return node;
  }
);

const leftAssociativeBinary = exp => nodeList => {
  const newNodeList = [];

  let leftValue = null;
  let operator = null;
  let done = false;

  for (const node of nodeList) {
    if (!done) {
      if (node.value.match && node.value.match(exp)) {
        operator = node;
      } else if (operator) {
        newNodeList.push({
          type: 'application',
          value: [operator, leftValue, node],
          children: [leftValue, operator, node],
        });
        done = true;
      } else {
        if (leftValue !== null) {
          newNodeList.push(leftValue);
        }
        leftValue = node;
      }
    } else {
      newNodeList.push(node);
    }
  }

  if (!done && leftValue) {
    newNodeList.push(leftValue);
  }

  return newNodeList;
};

const applyOperatorPrecedence = composeParsers(
  repeat(leftAssociativeBinary(/\+/))
);

const groupNodes = composeParsers(
  tag(/^\s+$/, 'whiteSpace'),
  mergeAdjacent('whiteSpace'),
  groupParens,
  recursively(mergeAdjacent('sourceString')),
  recursively(remove('whiteSpace')),
  tokenize
);

const groupStage = composeParsers(
  groupNodes,
  applyOperatorPrecedence
);

const parse = sourceString => composeParsers(
  groupStage,
  recursively(upgradeTypes),
  ensureSingleNode
)(stringToNodeList(sourceString));

/*
const log = fn => (...args) => {
  const res = fn(...args);
  console.log(JSON.stringify(res, null, 2));
  return res;
};*/

module.exports = {
  groupNodes,
  groupStage,
  parse,
  composeParsers,
  mergeAdjacent,
  ensureSingleNode,
  stringToNodeList,
};
