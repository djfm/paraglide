const {
  parseChar,
} = require('./harness/testParsers');

const {
  zeroOrMore,
  sequence,
  first,
  allowFailure,
} = require('../lib/parsing/parserEnhancers');

const ParseError = require('../lib/parsing/ParseError');

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
  });

  describe('allowFailure', () => {
    it('skips a parser that throws a ParseError', () =>
      allowFailure(
        () => { throw new ParseError(); }
      )('ab').should.deep.equal({
        recognized: [],
        remaining: ['a', 'b'],
      })
    );
  });

  describe('first', () => {
    const recognizeA = parseChar('a');
    const recognizeAB = sequence(parseChar('a'), parseChar('b'));

    it('tries all parsers in order and uses the first to match', () => {
      first(
        recognizeA,
        recognizeAB
      )('ab').should.deep.equal({
        recognized: ['a'],
        remaining: ['b'],
      });

      first(
        recognizeAB,
        recognizeA
      )('ab').should.deep.equal({
        recognized: ['a', 'b'],
        remaining: [],
      });
    });

    it('doesn\'t really care about failure', () =>
      first(recognizeA)('b').should.deep.equal({
        recognized: [],
        remaining: ['b'],
      })
    );
  });
});
