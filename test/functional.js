const {
  map,
  takeWhile,
  flatten,
} = require('../lib/functional');

const show = JSON.stringify;

describe('The functional utility functions', () => {
  describe('"flatten" flattens an iterable of maybe iterables', () => {
    const examples = [
      [[1], [1]],
      [[[1, 2]], [1, 2]],
      [['abc'], ['a', 'b', 'c']],
      [[1, 2], [1, 2]],
      [[1, 2, [3, 'abc', ['d']]], [1, 2, 3, 'a', 'b', 'c', 'd']],
    ];
    examples.forEach(([input, output]) =>
      it(`flatten(${input.map(show).join(', ')}) -> ${show(output)}`, () =>
        flatten(...input).should.deep.equal(output)
      )
    );
  });

  describe('map :: fn -> iterable -> array', () => {
    it('maps a function over a list', () =>
      map(x => x * 2)([1, 2]).should.deep.equal(
        [2, 4]
      )
    );
    it('maps a function over a string', () =>
      map(x => x + x)('ab').should.deep.equal(
        ['aa', 'bb']
      )
    );
  });

  describe('takeWhile :: predicate -> iterable -> [array, array]', () => {
    const predicate = x => x;
    const examples = [
      [[], [[], []]],
      [[1], [[1], []]],
      [[1, 1], [[1, 1], []]],
      [[1, 1, 0], [[1, 1], [0]]],
      [[1, 1, 0, 0], [[1, 1], [0, 0]]],
    ];

    examples.forEach(([input, output]) =>
      it(`takeWhile(x => x)(${show(input)}) -> ${show(output)}`, () =>
        takeWhile(predicate)(input).should.deep.equal(output)
      )
    );

    it('also accepts input as multiple arguments', () =>
      takeWhile(x => x)(1, 1, 0).should.deep.equal(
        [[1, 1], [0]]
      )
    );
  });
});
