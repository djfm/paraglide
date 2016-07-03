const stdlib = require('../../../lib/stdlib');

exports.ast = {
  type: 'application',
  value: {
    operator: stdlib['+'],
    operands: [{
      type: ['number'],
      value: 1,
    }, {
      type: ['number'],
      value: 2,
    }],
  },
};
