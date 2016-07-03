const { parse } = require('./parser');

const reduce = node => {
  if (node.type === 'application') {
    const { operator, operands: [firstOperand, ...nextOperands] } = node.value;
    const newOperator = {
      type: operator.type.splice(1),
      value: operator.value(firstOperand.value),
    };

    const newNode = Object.assign({}, node, {
      value: {
        operator: newOperator,
        operands: nextOperands,
      },
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
