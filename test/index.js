const {
  charParser,
  tag,
  runParser,
  sequence,
  recognized,
  unrecognized,
} = require('../lib/parsing');

describe.only('Internals', () => {
  describe('"recognized" marks nodes as recognized', () => {
    it('recognizes "a"', () =>
      recognized('hello').should.deep.equal({
        recognized: true,
        nodes: ['h', 'e', 'l', 'l', 'o'],
      })
    );
    it('doesn\'t change one recognized node - recognized is "true"', () =>
      recognized({ recognized: true, nodes: ['a'] })
        .should.deep.equal({
          recognized: true,
          nodes: ['a'],
        })
    );
    it('doesn\'t change one recognized node - recognized is truthy', () =>
      recognized({ recognized: 'a', nodes: ['a'] })
        .should.deep.equal({
          recognized: 'a',
          nodes: ['a'],
        })
    );
  });

  describe('"recognized.withTag(tag)" marks nodes as recognized ' +
           ' and remembers what was recognized', () => {
    it('marks "a"', () =>
      recognized.withTag('A')('a').should.deep.equal({
        recognized: 'A',
        nodes: ['a'],
      })
    );
    it('updates one recognized node - recognized is "true"', () =>
      recognized.withTag('A')({ recognized: true, nodes: ['a'] })
        .should.deep.equal({
          recognized: 'A',
          nodes: ['a'],
        })
    );
    it('doesn\'t change one recognized node - recognized is truthy', () =>
      recognized.withTag('A')({ recognized: 'a', nodes: ['a'] })
        .should.deep.equal({
          recognized: 'A',
          nodes: [{
            recognized: 'a',
            nodes: ['a'],
          }],
        })
    );
  });

  describe('"unrecognized" marks nodes as unrecognized', () => {
    it('unrecognizes "a"', () =>
      unrecognized('a').should.equal('a')
    );

    it('cannot unrecognize a recognized node', () =>
      unrecognized(recognized('a')).should.deep.equal(
        recognized('a')
      )
    );

    it('cannot unrecognize a tagged recognized node', () =>
      unrecognized(recognized.withTag('A')('a')).should.deep.equal(
        recognized.withTag('A')('a')
      )
    );
  });
});

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

  it('tags the sequence "ab"', () =>
    runParser(tag('ab')(sequence('ab')))('ab').should.deep.equal({
      recognized: 'ab',
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

  it('tags the sequence "ab" in "abc" but leaves the "c"', () =>
    runParser(tag('ab')(sequence('ab')))('abc').should.deep.equal({
      recognized: true,
      nodes: [{
        recognized: 'ab',
        nodes: ['a', 'b'],
      }, {
        recognized: false,
        nodes: ['c'],
      }],
    })
  );
});
