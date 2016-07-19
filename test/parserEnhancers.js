const chai = require('chai');

const {
  parseChar,
} = require('./harness/testParsers');

const {
  zeroOrMore,
  sequence,
  first,
} = require('../lib/parsing/parserEnhancers');

const ParseError = require('../lib/parsing/ParseError');

describe('Parser Enhancers', () => {
  describe('"zeroOrMore" is like "*" in a regular expression', () => {
    it('does not recognize anything if the parser doesn\'t', () =>
      zeroOrMore(
        parseChar('a')
      )('bb').should.deep.equal({
        recognized: [],
        remaining: ['b', 'b'],
      })
    );

    it('concatenates what the parser recognized and leaves the rest', () =>
      zeroOrMore(
        parseChar('a')
      )('aab').should.deep.equal({
        recognized: ['a', 'a'],
        remaining: ['b'],
      })
    );
  });

  describe('"sequence" applies parsers one after the other to the input', () => {
    it(
      'recognizes the "ab" sequence using a parser for "a" and a parser for "b"',
      () => sequence(parseChar('a'), parseChar('b'))('ab').should.deep.equal({
        recognized: ['a', 'b'],
        remaining: [],
      })
    );

    it(
      'returns what the last parser did not recognize',
      () => sequence(parseChar('a'), parseChar('b'))('abc').should.deep.equal({
        recognized: ['a', 'b'],
        remaining: ['c'],
      })
    );

    it('executes all parsers regardless of what is recognized', () => {
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

    it('executes all parsers regardless of whether there is input left', () => {
      const callMe = chai.spy(nodeList => ({
        recognized: [],
        remaining: [...nodeList],
      }));

      sequence(
        parseChar('a'),
        callMe
      )('a').should.deep.equal({
        recognized: ['a'],
        remaining: [],
      });

      callMe.should.have.been.called();
    });
  });

  describe('"first" is used to handle precedence', () => {
    it('returns the result of the first parser if it recognizes something',
      () => first(parseChar('a'), parseChar('b'))('ab').should.deep.equal({
        recognized: ['a'],
        remaining: ['b'],
      })
    );

    it('returns the result of the second parser if the first parser did not match',
      () => first(parseChar('a'), parseChar('b'))('ba').should.deep.equal({
        recognized: ['b'],
        remaining: ['a'],
      })
    );

    it('does not recognize anything if no parser matched',
      () => first(parseChar('a'), parseChar('b'))('xy').should.deep.equal({
        recognized: [],
        remaining: ['x', 'y'],
      })
    );

    it('two or more parsers',
      () => first(parseChar('a'), parseChar('b'), parseChar('c'))('cd')
              .should.deep.equal({
                recognized: ['c'],
                remaining: ['d'],
              })
    );

    describe('error handling', () => {
      const throwingParser = (message = 'Oops!') => () => {
        throw new ParseError(message);
      };

      it('throws if the first parser doesn\'t throw and the next one throws',
        () => chai.expect(
          () => first(parseChar('a'), throwingParser())('x')
        ).to.throw(ParseError)
      );

      it('throws if the first parser throws and the next one doesn\'t match',
        () => chai.expect(
          () => first(throwingParser(), parseChar('a'))('x')
        ).to.throw(ParseError)
      );

      it('doesn\'t throw if the second parser matches',
        () => first(throwingParser(), parseChar('a'))('ab')
                .should.deep.equal({
                  recognized: ['a'],
                  remaining: ['b'],
                })
      );

      it('throws the error from the first parser if both throw',
        () => chai.expect(
          () => first(throwingParser('first'), throwingParser('second'))('x')
        ).to.throw(ParseError, 'first')
      );
    });
  });
});
