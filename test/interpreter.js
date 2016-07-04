const { interpreter } = require('..');

describe('Arithmetic operations', () => {
  context('the interpreter', () => {
    it('should compute a sum',
      () => interpreter.run('1 + 2').should.eventually.deep.equal({
        type: ['number'],
        value: 3,
      })
    );
    it('should compute a double sum',
      () => interpreter.run('1 + 2 + 3').should.eventually.deep.equal({
        type: ['number'],
        value: 6,
      })
    );
  });
});
