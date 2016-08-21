const {
  charParser,
  sequence,
  first,
  tag,
  optional,
  oneOrMore,
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

describe('The "tag" combinator', () => {
  it('tags the recognized output of a parser', () =>
    tag('a')(charParser('a'))('a').should.deep.equal({
      tag: { recognized: true },
      nodes: [
        { tag: { recognized: true, type: 'a' }, nodes: ['a'] },
      ],
    })
  );

  it('does nothing special if the tagged parser does not recognize', () =>
    tag('a')(charParser('a'))('b').should.deep.equal({
      tag: { recognized: false },
      nodes: [
        { tag: { recognized: false }, nodes: ['b'] },
      ],
    })
  );

  it('tags the recognized output of a parser and leaves the rest', () =>
    tag('a')(charParser('a'))('ab').should.deep.equal({
      tag: { recognized: true },
      nodes: [
        { tag: { recognized: true, type: 'a' }, nodes: ['a'] },
        { tag: { recognized: false }, nodes: ['b'] },
      ],
    })
  );

  it('treats multiple arguments as an implicit sequence of parsers', () =>
    tag('ab')(charParser('a'), charParser('b'))('ab').should.deep.equal({
      tag: { recognized: true },
      nodes: [
        { tag: { recognized: true, type: 'ab' }, nodes: ['a', 'b'] },
      ],
    })
  );

  it('tags the recognized output of a more complex parser and leaves the rest', () =>
    tag('ab')(charParser('a'), charParser('b'))('abc').should.deep.equal({
      tag: { recognized: true },
      nodes: [
        { tag: { recognized: true, type: 'ab' }, nodes: ['a', 'b'] },
        { tag: { recognized: false }, nodes: ['c'] },
      ],
    })
  );
});

describe('The "optional" combinator', () => {
  const o = optional(charParser('a'));

  it('does not change the behaviour of a parser that matches', () =>
    o('a').should.deep.equal({
      tag: { recognized: true },
      nodes: [{ tag: { recognized: true }, nodes: ['a'] }],
    })
  );

  it('matches the end of input', () =>
    o().should.deep.equal({
      tag: { recognized: true },
      nodes: [],
    })
  );

  it('turns failure into success', () => {
    o('b').should.deep.equal({
      tag: { recognized: true },
      nodes: [{ tag: { recognized: false }, nodes: ['b'] }],
    });

    sequence(o, charParser('b'))('b').should.deep.equal({
      tag: { recognized: true },
      nodes: [{ tag: { recognized: true }, nodes: ['b'] }],
    });
  });
});

describe('The "oneOrMore" combinator', () => {
  const as = oneOrMore(charParser('a'));
  it('recognizes one instance of what the parser matches', () =>
    as('a').should.deep.equal({
      tag: { recognized: true },
      nodes: [{ tag: { recognized: true }, nodes: ['a'] }],
    })
  );

  it('recognizes several instances of what the parser matches', () =>
    as('aaa').should.deep.equal({
      tag: { recognized: true },
      nodes: [{ tag: { recognized: true }, nodes: ['a', 'a', 'a'] }],
    })
  );

  it('recognizes instances and leaves the rest', () =>
    as('aaab').should.deep.equal({
      tag: { recognized: true },
      nodes: [
        { tag: { recognized: true }, nodes: ['a', 'a', 'a'] },
        { tag: { recognized: false }, nodes: ['b'] },
      ],
    })
  );
});
