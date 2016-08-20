const {
  charParser,
  sequence,
} = require('../lib/parsing');

describe('A "charParser" for the char "a"', () => {
  const p = charParser('a');

  it('recognizes the string "a"', () =>
    p('a').should.deep.equal({
      tag: { recognized: true },
      nodes: [{
        tag: { recognized: true },
        nodes: ['a'],
      }],
    })
  );

  it('recognizes the string "a" in "ab" and leave the "b"', () =>
    p('ab').should.deep.equal({
      tag: { recognized: true },
      nodes: [{
        tag: { recognized: true },
        nodes: ['a'],
      }, {
        tag: { recognized: false },
        nodes: ['b'],
      }],
    })
  );
});

describe('The "sequence" combinator', () => {
  describe('a sequence made of parsers for "a" and "b"', () => {
    const a = charParser('a');
    const b = charParser('b');

    const ab = sequence(a, b);

    it('does not recognize the string "a"', () =>
      ab('a').should.deep.equal({
        tag: { recognized: false },
        nodes: [
          { tag: { recognized: false }, nodes: ['a'] },
        ],
      })
    );

    it('recognizes the string "ab"', () =>
      ab('ab').should.deep.equal({
        tag: { recognized: true },
        nodes: [{
          tag: { recognized: true },
          nodes: ['a', 'b'],
        }],
      })
    );

    it('recognizes the string "ab" in "abc" and leaves the "c"', () =>
      ab('abc').should.deep.equal({
        tag: { recognized: true },
        nodes: [{
          tag: { recognized: true },
          nodes: ['a', 'b'],
        }, {
          tag: { recognized: false },
          nodes: ['c'],
        }],
      })
    );

    it('recognizes the string "ab" in "abcd" and leaves the "cd"', () =>
      ab('abcd').should.deep.equal({
        tag: { recognized: true },
        nodes: [{
          tag: { recognized: true },
          nodes: ['a', 'b'],
        }, {
          tag: { recognized: false },
          nodes: ['c', 'd'],
        }],
      })
    );
  });
});
