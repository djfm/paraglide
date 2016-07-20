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
  describe('"eatWhile"', () => {
    it('eats the input while the predicate matches', () =>
      eatWhile(equals('a'))('aaa').should.deep.equal({
        recognized: ['a', 'a', 'a'],
        remaining: [],
      })
    );

    it('keeps track of what remains to be parsed', () =>
      eatWhile(equals('a'))('aaabb').should.deep.equal({
        recognized: ['a', 'a', 'a'],
        remaining: ['b', 'b'],
      })
    );
  });

  describe('"eatExactlyOne"', () => {
    it('eats exactly one node if it matches the predicate', () =>
      eatExactlyOne(equals('a'))('a').should.deep.equal({
        recognized: ['a'],
        remaining: [],
      })
    );

    it('keeps track of what remains to be parsed', () =>
      eatExactlyOne(equals('a'))('abb').should.deep.equal({
        recognized: ['a'],
        remaining: ['b', 'b'],
      })
    );

    it('throws an exception if it does not find what it is looking for',
      () => chai.expect(
        () => eatExactlyOne(equals('a'))('b')
      ).to.throw(ParseError)
    );
  });

  describe('"groupBetween"', () => {
    const makeParser = () =>
      groupBetween(
        equals('('),
        equals(')'),
        recognized => [recognized]
      )
    ;

    it('does not cause a recursion when called', () => {
      // Yeah, JS not being lazyly evaluated,
      // you cannot do *everything* like in Haskell
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

    it('groups nodes between parens', () =>
      makeParser()('(a)').should.deep.equal({
        recognized: [['(', 'a', ')']],
        remaining: [],
      })
    );

    it('groups multiple nodes between parens', () =>
      makeParser()('(ab)').should.deep.equal({
        recognized: [['(', 'a', 'b', ')']],
        remaining: [],
      })
    );

    it('groups nodes deeply', () =>
      makeParser()('((a))').should.deep.equal({
        recognized: [['(', ['(', 'a', ')'], ')']],
        remaining: [],
      })
    );

    it('groups nodes very deeply', () =>
      makeParser()('(((a)))').should.deep.equal({
        recognized: [['(', ['(', ['(', 'a', ')'], ')'], ')']],
        remaining: [],
      })
    );

    it('groups nodes even preceded by a non group context',
      () => makeParser()('b(a)').should.deep.equal({
        recognized: ['b', ['(', 'a', ')']],
        remaining: [],
      })
    );

    it('groups nodes even followed by a non group context',
      () => makeParser()('(a)b').should.deep.equal({
        recognized: [['(', 'a', ')'], 'b'],
        remaining: [],
      })
    );

    it('fails if a group is lacking a closing node',
      () => chai.expect(
        () => makeParser()('(a')
      ).to.throw(ParseError)
    );

    it('fails if a closing node is found without a corresponding opening node',
      () => chai.expect(
        () => makeParser()(')a')
      ).to.throw(ParseError)
    );

    it('recognizes multiple groups',
      () => makeParser()('(a)(b)').should.deep.equal({
        recognized: [['(', 'a', ')'], ['(', 'b', ')']],
        remaining: [],
      })
    );

    describe('recognizes different types of groups', () => {
      const groupBraces = groupBetween(
        equals('{'),
        equals('}'),
        recognized => [recognized]
      );

      const groupEverything = groupBetween(
        equals('('),
        equals(')'),
        recognized => [groupBraces(recognized).recognized]
      );

      it('braces grouped inside parens', () =>
        groupEverything('({a})').should.deep.equal({
          recognized: [['(', ['{', 'a', '}'], ')']],
          remaining: [],
        })
      );

      xit('parens grouped inside braces', () =>
        groupEverything('{(a)}').should.deep.equal({
          recognized: [['{', ['(', 'a', ')'], '']],
          remaining: [],
        })
      );
    });
  });
});
