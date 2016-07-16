const {
  equals,
  empty,
  not,
  lazyly,
  liftLeftAssociativeBinary,
} = require('../lib/functional');

const chai = require('chai');

describe('The functional utility library', () => {
  describe('equals returns a predicate that checks strict equality', () => {
    it('should not consider 1 and "1" as equal', () =>
      equals(1)('1').should.be.false
    );
    it('should consider "apple" and "apple" as equal', () =>
      equals('apple')('apple').should.be.true
    );
  });

  describe('the empty function checks whether an iterable is empty', () => {
    it('should say that an array with values is not empty', () =>
      empty(['hey']).should.be.false
    );
    it('should say that an array without values is empty', () =>
      empty([]).should.be.true
    );
    it('should say that a non-zero length string is not empty', () =>
      empty('hey').should.be.false
    );
    it('should say that the empty string is empty', () =>
      empty('').should.be.true
    );
  });

  describe('not negates a predicate', () => {
    it(
      'accepts a predicate and returns a new predicate with opposite result',
      () => {
        const isTheAChar = valueToTest => valueToTest === 'a';
        /* eslint-disable no-unused-expressions */
        not(isTheAChar)('a').should.be.false;
        not(isTheAChar)('b').should.be.true;
        /* eslint-enable no-unused-expressions */
      }
    );
  });

  describe('lazyly', () => {
    it(
      'decorates a function that returns a function so that it is called as needed',
      () => {
        const dontCallMeNow = chai.spy(x => y => x * y);
        const lazyVersion = lazyly(dontCallMeNow)(2);
        dontCallMeNow.should.not.have.been.called();
        lazyVersion(3).should.equal(6);
      }
    );
  });

  describe('liftLeftAssociativeBinary', () => {
    const sum = (a, b) => a + b;

    it(
      'turns a function of type (a, a) => a into a function of type (...a) => a' +
      ', associating to the left',
      () => liftLeftAssociativeBinary(sum)(1, 2, 3).should.equal(6)
    );

    it('should complain if called with 1 argument only',
      () => chai.expect(() => liftLeftAssociativeBinary(sum)(1)).to.throw()
    );

    it('should complain if called with no arguments at all',
      () => chai.expect(() => liftLeftAssociativeBinary(sum)()).to.throw()
    );
  });
});
