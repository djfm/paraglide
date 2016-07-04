module.exports = {
  '+': {
    type: ['number', 'number', 'number'],
    value: lhs => rhs => ({
      type: ['number'],
      value: lhs.value + rhs.value,
    }),
  },
};
