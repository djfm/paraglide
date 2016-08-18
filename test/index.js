const {
  charParser,
} = require('../lib/parsing');

describe('A "charParser" for the char "a"', () => {
  const p = charParser('a');

  it('should recognize the string "a"', () =>
    p('a').should.deep.equal({
      tag: { recognized: true },
      nodes: [{
        tag: { recognized: true },
        nodes: ['a'],
      }],
    })
  );

  it('should recognize the string "a" in "ab" and leave the "b"', () =>
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
