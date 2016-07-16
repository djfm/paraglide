const {
  parseChar,
} = require('./harness/testParsers');

const {
  zeroOrMore,
  sequence,
} = require('../lib/parsing/parserEnhancers');

describe('Parser Enhancers', () => {
  describe('zeroOrMore is like "*" in a regular expression', () => {
    it('should not recognize anything if the parser doesn\'t', () =>
      zeroOrMore(
        parseChar('a')
      )('bb').should.deep.equal({
        recognized: [],
        remaining: ['b', 'b'],
      })
    );

    it('should concatenate what the parser recognized and leave the rest', () =>
      zeroOrMore(
        parseChar('a')
      )('aab').should.deep.equal({
        recognized: ['a', 'a'],
        remaining: ['b'],
      })
    );
  });

  describe('sequence applies parsers one after the other to the input', () => {
    it(
      'should recognize the "ab" sequence using a parser for "a" and a parser for "b"',
      () => sequence(parseChar('a'), parseChar('b'))('ab').should.deep.equal({
        recognized: ['a', 'b'],
        remaining: [],
      })
    );

    it(
      'should return what the last parser did not recognize',
      () => sequence(parseChar('a'), parseChar('b'))('abc').should.deep.equal({
        recognized: ['a', 'b'],
        remaining: ['c'],
      })
    );

    it('should execute all parsers while there are nodes to parse ' +
    ', whether or not they recognize stuff', () => {
      const shouldNotRecognize = parseChar('b');
      const shouldRecognize = parseChar('a');
      sequence(
        shouldNotRecognize,
        shouldRecognize
      )('a').should.deep.equal({
        recognized: ['a'],
        remaining: [],
      });
    });
  });
});
