const { interpreter } = require('..');

describe('Arithmetic operations', () => {
  context('the interpreter', () => {
    it('should compute a sum',
      () => interpreter.run('1 + 2').should.eventually.equal(3)
    );
  });
});
