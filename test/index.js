const {
  charParser,
  tag,
  runParser,
  sequence,
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
  it('parses only one digit "1" in "11"', () =>
    p('11').should.deep.equal({
      recognized: true,
      nodes: [{
        recognized: true,
        nodes: ['1'],
      }, {
        recognized: false,
        nodes: ['1'],
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

describe('"sequence" accept parsers and returns parsers', () => {
  const abParser = runParser(
    sequence(charParser('a'), charParser('b'))
  );

  it('recognizes the sequence "ab"', () =>
    abParser('ab').should.deep.equal({
      recognized: true,
      nodes: ['a', 'b'],
    })
  );

  it('doesn\'t recognize the sequence "ac"', () =>
    abParser('ac').should.deep.equal({
      recognized: false,
      nodes: ['a', 'c'],
    })
  );

  it('recognizes the sequence "ab" in "abc" but leaves the "c"', () =>
    abParser('abc').should.deep.equal({
      recognized: true,
      nodes: [{
        recognized: true,
        nodes: ['a', 'b'],
      }, {
        recognized: false,
        nodes: ['c'],
      }],
    })
  );
});
