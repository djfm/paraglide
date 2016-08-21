const {
  sequence,
  first,
  oneOrMore,
  tag,
} = require('./parsing');

const multiplication = sequence(null, '*', null);
const addition = sequence(null, '+', null);
const digit = first('0123456789');
const integer = tag('integer')(oneOrMore(digit));
const floating = sequence(integer, '.', integer);

const expression = first(
  floating,
  integer,
  multiplication,
  addition
);

module.exports = {
  multiplication,
  addition,
  digit,
  integer,
  floating,
  expression,
};
