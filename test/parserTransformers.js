const {
  parseChar,
} = require('./harness/testParsers');

const {
  applyToRecognized,
  ifNextNodeMatches,
} = require('../lib/parsing/parserTransformers');

describe('Parser Transformers', () => {
  describe('applyToRecognized', () => {
    it(
      'replaces what a parser would normally have returned with something else',
      () => applyToRecognized(
        ([a]) => [a.toUpperCase()]
      )(parseChar('a'))('a').should.deep.equal({
        recognized: ['A'],
        remaining: [],
      })
    );

    it(
      'is ignores the transform if thee parser did not match anything',
      () => applyToRecognized(
        ([a]) => [a.toUpperCase()]
      )(parseChar('a'))('b').should.deep.equal({
        recognized: [],
        remaining: ['b'],
      })
    );

    describe('ifNextNodeMatches', () => {
      const predicate = node => node === 'a';

      it(
        'applies the parser if the predicate matches the next node to parse',
        () => ifNextNodeMatches(predicate)(parseChar('a'))('a')
                .should.deep.equal({
                  recognized: ['a'],
                  remaining: [],
                })
      );

      it(
        'doesn\'t apply the parser if the predicate doesn\'t matches the next node to parse',
        () => ifNextNodeMatches(predicate)(parseChar('a'))('bcd')
                .should.deep.equal({
                  recognized: [],
                  remaining: ['b', 'c', 'd'],
                })
      );
    });
  });
});
