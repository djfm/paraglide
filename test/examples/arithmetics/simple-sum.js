const stdlib = require('../../../lib/stdlib');

exports.ast = {
  type: ['number'],
  value: [
    stdlib['+'],
    {
      type: ['number'],
      value: 1,
    },
    {
      type: ['number'],
      value: 2,
    },
  ],
};
