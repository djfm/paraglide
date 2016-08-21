const {
  digit,
} = require('../lib/grammar');

describe('The grammar', () => {
  describe('digit is an unnamed parser', () => {
    it('recognizes digits in the range 0-9', () =>
      digit('4').should.deep.equal({
        tag: { recognized: true },
        nodes: [{ tag: { recognized: true }, nodes: ['4'] }],
      })
    );
  });
});
