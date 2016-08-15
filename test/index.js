const {
  digit,
} = require('../lib/grammar');

describe('A digit parser', () => {
  it('parses the digit "1"', () =>
    digit('1').should.deep.equal({
      recognized: true,
      nodes: ['1'],
    })
  );
  it('doesn\'t parse the string "a"', () =>
    digit('a').should.deep.equal({
      recognized: false,
      nodes: ['a'],
    })
  );
  it('parses the digit "1" in "1ab" but leaves the "ab"', () =>
    digit('1ab').should.deep.equal({
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
