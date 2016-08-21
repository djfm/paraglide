const {
  digit,
  integer,
  floating,
} = require('../lib/grammar');

const {
  ast,
} = require('../lib/ast');

describe('The grammar', () => {
  describe('digit is an untyped parser', () => {
    it('recognizes digits in the range 0-9', () =>
      digit('4').should.deep.equal({
        tag: { recognized: true },
        nodes: [{ tag: { recognized: true }, nodes: ['4'] }],
      })
    );
  });

  describe('integer is a typed parser', () => {
    it('recognizes "4"', () =>
      integer('4').should.deep.equal({
        tag: { recognized: true },
        nodes: [{ tag: { recognized: true, type: 'integer' }, nodes: ['4'] }],
      })
    );

    it('recognizes "42"', () =>
      integer('42').should.deep.equal({
        tag: { recognized: true },
        nodes: [
          {
            tag: { recognized: true, type: 'integer' },
            nodes: ['4', '2'],
          },
        ],
      })
    );
  });

  describe('floating is a typed parser', () => {
    it('does not recognize "4"', () =>
      floating('4').should.deep.equal({
        tag: { recognized: false },
        nodes: [{ tag: { recognized: false }, nodes: ['4'] }],
      })
    );

    it('recognizes "4.2"', () =>
      floating('4.2').should.deep.equal({
        tag: { recognized: true },
        nodes: [
          {
            tag: { recognized: true, type: 'floating' },
            nodes: [
              { tag: { recognized: true, type: 'integer' }, nodes: ['4'] },
              '.',
              { tag: { recognized: true, type: 'integer' }, nodes: ['2'] },
            ],
          },
        ],
      })
    );

    it('recognizes "4.2" and extracts AST', () =>
      ast(floating('4.2')).should.deep.equal({
        type: 'floating',
        nodes: [
          { type: 'integer', nodes: ['4'] },
          '.',
          { type: 'integer', nodes: ['2'] },
        ],
      })
    );
  });
});
