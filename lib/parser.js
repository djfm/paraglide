const stdlib = require('./stdlib');

const {
  compose,
  hasProperty,
  selectProperty,
} = require('./functional');

const {
  transformAdjacent,
} = require('./parsing/parserGenerators');

const stringToNodeList = (string, lineNumber = 1, colNumber = 1) => {
  const [firstChar, ...restOfString] = string;

  if (firstChar === undefined) {
    return [];
  }

  const updatedPos = firstChar === '\n' ?
    [lineNumber + 1, 1] :
    [lineNumber, colNumber + 1]
  ;

  return [
    {
      type: 'sourceString',
      value: firstChar,
      children: firstChar,
      pos: { lineNumber, colNumber },
    },
    ...stringToNodeList(restOfString, ...updatedPos),
  ];
};

const mustComplete = parser =>
  (...parserArgs) => {
    const { recognized } = parser(...parserArgs);
    return recognized;
  }
;

const mergeAdjacent = nodeType =>
  mustComplete(
    transformAdjacent(hasProperty('type', nodeType), nodeList => [{
      type: nodeType,
      value: nodeList.map(({ value }) => value).join(''),
      children: nodeList,
    }])
  )
;

const recognizeWhiteSpace =
  transformAdjacent(({ value }) => value.match(/^\s+$/), nodeList => [{
    type: 'whiteSpace',
    value: nodeList.map(({ value }) => value).join(''),
    children: nodeList,
  }])
;

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

const remove = nodeType => nodeList => nodeList.reduce(
  (updatedList, node) =>
    (node.type === nodeType ? updatedList : updatedList.concat(node)),
  []
);

// select and map??
const groupBetween = (startExp, endExp, nodeType) => nodeList => {
  const parser = nodes => {
    if (nodes.length === 0) {
      return {
        recognized: [],
        remaining: [],
      };
    }

    const [node, ...nextNodes] = nodes;

    if (node.value.match(startExp)) {
      const { recognized, remaining } = parser(nextNodes);
      const next = parser(remaining);
      return {
        recognized: [{
          type: nodeType,
          value: recognized.slice(0, -1),
          children: [node, ...recognized],
        }, ...next.recognized],
        remaining: next.remaining,
      };
    } else if (node.value.match(endExp)) {
      return {
        recognized: [node],
        remaining: nextNodes,
      };
    }

    const { recognized, remaining } = parser(nextNodes);

    return {
      recognized: [node, ...recognized],
      remaining,
    };
  };

  return parser(nodeList).recognized;
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

const applyOperatorPrecedence = compose(
  repeat(leftAssociativeBinary(/\+/))
);

const groupNodes = compose(
  recognizeWhiteSpace,
  selectProperty('recognized'),
  groupParens,
  recursively(mergeAdjacent('sourceString')),
  recursively(remove('whiteSpace')),
  tokenize
);

const groupStage = compose(
  groupNodes,
  applyOperatorPrecedence
);

const parse = sourceString => compose(
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
  groupBetween,
  parse,
  compose,
  mergeAdjacent,
  ensureSingleNode,
  stringToNodeList,
};
