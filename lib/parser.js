const { compose, identity } = require('./functional');
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


const promoteToNode = (nodeType, makeValueFromNodeList = identity) => parser =>
  nodeList => {
    const { recognized, remaining } = parser(nodeList);

    if (recognized.length > 0) {
      return {
        recognized: [{
          type: nodeType,
          value: makeValueFromNodeList(recognized),
          children: recognized,
        }],
        remaining,
      };
    }

    return { recognized, remaining };
  }
;

const mustComplete = parser =>
  (...parserArgs) => {
    const { recognized } = parser(...parserArgs);
    return recognized;
  }
;

const concatValues = nodeList =>
  nodeList.map(({ value }) => value).join('')
;

const mergeAdjacent = nodeType =>
  mustComplete(
    concatenate(
      either(
        eatWhile(({ type }) => type !== nodeType),
        promoteToNode(nodeType, concatValues)(
          eatWhile(({ type }) => type === nodeType)
        )
      )
    )
  )
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
  groupBetween,
  parse,
  composeParsers,
  mergeAdjacent,
  ensureSingleNode,
  stringToNodeList,
};
