const {
  charParser,
  sequence,
  first,
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

  it('does not recognize the string "b"', () =>
    p('b').should.deep.equal({
      tag: { recognized: false },
      nodes: [{
        tag: { recognized: false },
        nodes: ['b'],
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

describe('The "first" combinator', () => {
  describe('"first" of parsers for "a" and "b"', () => {
    const a = charParser('a');
    const b = charParser('b');

    const ab = first(a, b);

    it('recognizes the string "a"', () =>
      ab('a').should.deep.equal({
        tag: { recognized: true },
        nodes: [
          { tag: { recognized: true }, nodes: ['a'] },
        ],
      })
    );

    it('recognizes the string "a" in "ac" and leaves the rest', () =>
      ab('ac').should.deep.equal({
        tag: { recognized: true },
        nodes: [
          { tag: { recognized: true }, nodes: ['a'] },
          { tag: { recognized: false }, nodes: ['c'] },
        ],
      })
    );

    it('recognizes the string "a" in "ab" and leaves the rest', () =>
      ab('ab').should.deep.equal({
        tag: { recognized: true },
        nodes: [
          { tag: { recognized: true }, nodes: ['a'] },
          { tag: { recognized: false }, nodes: ['b'] },
        ],
      })
    );

    it('recognizes the string "b"', () =>
      ab('b').should.deep.equal({
        tag: { recognized: true },
        nodes: [
          { tag: { recognized: true }, nodes: ['b'] },
        ],
      })
    );

    it('recognizes the string "b" in "bc" and leaves the rest', () =>
      ab('bc').should.deep.equal({
        tag: { recognized: true },
        nodes: [
          { tag: { recognized: true }, nodes: ['b'] },
          { tag: { recognized: false }, nodes: ['c'] },
        ],
      })
    );

    it('does not recognize the string "c"', () =>
      ab('c').should.deep.equal({
        tag: { recognized: false },
        nodes: [
          { tag: { recognized: false }, nodes: ['c'] },
        ],
      })
    );
  });
});
