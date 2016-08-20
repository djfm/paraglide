const {
  map,
  takeWhile,
} = require('../lib/functional');

const show = JSON.stringify;

describe('The functional utility functions', () => {
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
