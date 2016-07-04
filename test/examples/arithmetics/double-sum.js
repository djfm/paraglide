const stdlib = require('../../../lib/stdlib');

exports.ast = exports.ast = {
  type: ['number'],
  value: [
    stdlib['+'],
    {
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
    },
    {
      type: ['number'],
      value: 3,
    },
  ],
};
