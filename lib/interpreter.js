const { parse } = require('./parser');

const requiresArguments = node =>
  node.type.length > 1
;

const isApplication = node =>
  node.value instanceof Array && requiresArguments(node.value[0])
;

const reduce = node => {
  if (isApplication(node)) {
    const [operator, firstOperand, ...nextOperands] = node.value;
    const newOperator = {
      type: operator.type.slice(1),
      value: operator.value(reduce(firstOperand)),
    };

    const newNode = Object.assign({}, node, {
      value: [newOperator, ...nextOperands],
    });

    if (newOperator.type.length > 1) {
      return reduce(newNode);
    }
    return newOperator.value;
  }
  return node;
};

const interpreter = {
  run: sourceCode => Promise.resolve(reduce(parse(sourceCode))),
};

module.exports = {
  interpreter,
};
