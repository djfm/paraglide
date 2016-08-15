const {
  charParser,
  tag,
  runParser,
} = require('../lib/parsing');

describe('A char parser for "1"', () => {
  const p = runParser(charParser('1'));

  it('parses the digit "1"', () =>
    p('1').should.deep.equal({
      recognized: true,
      nodes: ['1'],
    })
  );
  it('doesn\'t parse the string "a"', () =>
    p('a').should.deep.equal({
      recognized: false,
      nodes: ['a'],
    })
  );
  it('parses the digit "1" in "1ab" but leaves the "ab"', () =>
    p('1ab').should.deep.equal({
      recognized: true,
      nodes: [{
        recognized: true,
        nodes: ['1'],
      }, {
        recognized: false,
        nodes: ['a', 'b'],
      }],
    })
  );
});

describe('A tagged char parser for "1"', () => {
  const p = runParser(tag('one')(charParser('1')));

  it('parses the digit "1"', () =>
    p('1').should.deep.equal({
      recognized: 'one',
      nodes: ['1'],
    })
  );
  it('doesn\'t parse the string "a"', () =>
    p('a').should.deep.equal({
      recognized: false,
      nodes: ['a'],
    })
  );
  it('parses the digit "1" in "1ab" but leaves the "ab"', () =>
    p('1ab').should.deep.equal({
      recognized: true,
      nodes: [{
        recognized: 'one',
        nodes: ['1'],
      }, {
        recognized: false,
        nodes: ['a', 'b'],
      }],
    })
  );
});
