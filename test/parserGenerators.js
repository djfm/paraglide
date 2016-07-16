const chai = require('chai');

const {
  equals,
} = require('../lib/functional');

const {
  groupBetween,
  eatWhile,
  eatExactlyOne,
} = require('../lib/parsing/parserGenerators');

const ParseError = require('../lib/parsing/ParseError');

describe('Parser Generators', () => {
  describe('eatWhile', () => {
    it('should eat the input while the predicate matches', () =>
      eatWhile(equals('a'))('aaa').should.deep.equal({
        recognized: ['a', 'a', 'a'],
        remaining: [],
      })
    );

    it('should keep track of what remains to be parsed', () =>
      eatWhile(equals('a'))('aaabb').should.deep.equal({
        recognized: ['a', 'a', 'a'],
        remaining: ['b', 'b'],
      })
    );
  });

  describe('eatExactlyOne', () => {
    it('should eat exactly one node if it matches the predicate', () =>
      eatExactlyOne(equals('a'))('a').should.deep.equal({
        recognized: ['a'],
        remaining: [],
      })
    );

    it('should keep track of what remains to be parsed', () =>
      eatExactlyOne(equals('a'))('abb').should.deep.equal({
        recognized: ['a'],
        remaining: ['b', 'b'],
      })
    );

    it('should throw an exception if it doesn\'t find what it is looking for',
      () => chai.expect(
        () => eatExactlyOne(equals('a'))('b')
      ).to.throw(ParseError)
    );
  });

  describe('groupBetween', () => {
    const makeParser = () =>
      groupBetween(
        equals('('),
        equals(')'),
        recognized => [recognized]
      )
    ;

    it('should not cause a recursion when called', () => {
      try {
        makeParser();
      } catch (e) {
        if (e instanceof RangeError) {
          throw new Error(
            'Wow, "groupBetween" is messed up, calling it creates an infinite recursion.'
          );
        } else {
          throw e;
        }
      }
    });

    it('should group nodes between parens', () =>
      makeParser()('(a)').should.deep.equal({
        recognized: [['(', 'a', ')']],
        remaining: [],
      })
    );

    it('should group multiple nodes between parens', () =>
      makeParser()('(ab)').should.deep.equal({
        recognized: [['(', 'a', 'b', ')']],
        remaining: [],
      })
    );

    it('should group nodes deeply', () =>
      makeParser()('((a))').should.deep.equal({
        recognized: [['(', ['(', 'a', ')'], ')']],
        remaining: [],
      })
    );

    it('should group nodes even preceded by a non group context',
      () => makeParser()('b(a)').should.deep.equal({
        recognized: ['b', ['(', 'a', ')']],
        remaining: [],
      })
    );

    it('should group nodes even followed by a non group context',
      () => makeParser()('(a)b').should.deep.equal({
        recognized: [['(', 'a', ')'], 'b'],
        remaining: [],
      })
    );
  });
});
