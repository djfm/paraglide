const {
  parseChar,
} = require('./harness/testParsers');

const {
  applyToRecognized,
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
  });
});
