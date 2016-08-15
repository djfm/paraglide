const {
  sequence,
  first,
  repeat,
} = require('./parsing');

const multiplication = sequence(null, '*', null);
const addition = sequence(null, '+', null);
const digit = first('0123456789');
const integer = repeat(digit);
const floating = sequence(integer, '.', integer);

module.exports = {
  multiplication,
  addition,
  digit,
  integer,
  floating,
};