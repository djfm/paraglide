const { examples } = require('./harness/examples');

const {
  groupNodes,
  parse,
  composeParsers,
  mergeAdjacent,
  groupStage,
  stringToNodeList,
} = require('../lib/parser');

describe('The Parser', () => {
  context('internals', () => {
    describe('composeParsers', () => {
      it('should successively apply parsers', () => {
        const a = () => [1, 2];
        const b = nodes => nodes.splice(1);
        const c = nodes => nodes.concat(3);
        composeParsers(a, b, c)().should.deep.equal([2, 3]);
      });
    });

    describe('mergeAdjacent', () => {
      it('should merge adjacent nodes of the same type', () => {
        const m = {
          type: 't',
          value: 'a',
        };
        const n = {
          type: 't',
          value: 'b',
        };
        mergeAdjacent('t')([m, n]).should.deep.equal([{
          type: 't',
          value: 'ab',
          children: [m, n],
        }]);
      });
    });

    const structureOf = nodeList => nodeList.map(
      ({ type, value }) =>
        ((value instanceof Array) ?
          `${type}[${structureOf(value).join(', ')}]` :
          type)
    );

    const checkNodeStructuresAfter = method => (sourceString, expectedNodeTypes) =>
      it(`should detect "${expectedNodeTypes.join(', ')}" when parsing "${sourceString}"`,
        () => structureOf(method(stringToNodeList(sourceString)))
                .should.deep.equal(expectedNodeTypes)
      )
    ;

    describe('groupNodes', () => {
      const checkNodeStructures = checkNodeStructuresAfter(groupNodes);

      checkNodeStructures('1', ['number']);
      checkNodeStructures('abc', ['sourceString']);
      checkNodeStructures('1 + 2', ['number', 'operator', 'number']);
      checkNodeStructures('1  +  2', ['number', 'operator', 'number']);
      checkNodeStructures('1  +  \n 2  ', ['number', 'operator', 'number']);
      checkNodeStructures('()', ['parenGroup[]']);
      checkNodeStructures('(a)', ['parenGroup[sourceString]']);
      checkNodeStructures('(abc)', ['parenGroup[sourceString]']);
      checkNodeStructures('(ab cd)', ['parenGroup[sourceString, sourceString]']);
    });

    describe('groupStage', () => {
      const checkNodeStructures = checkNodeStructuresAfter(groupStage);

      checkNodeStructures('1 + 2', ['leftAssocBinOp[number, number]']);
      checkNodeStructures('1 + 2 + 3',
        ['leftAssocBinOp[leftAssocBinOp[number, number], number]']
      );
    });
  });

  context('language domain', () => {
    /* eslint-disable no-use-before-define */
    examples.forEach((folder, folderName) =>
      context(folderName, () => folder.forEach(
        ({ input, expected }, name) => it(`should parse a ${name}`, () => {
          const pluck = ({ type, value, operator }) => (
            operator ? { type, value, operator: simplifyStructure(operator) } : { type, value }
          );
          const simplifyStructure = node =>
            pluck(
              node.value instanceof Array ?
                Object.assign({}, node, {
                  value: node.value.map(simplifyStructure),
                }) :
                node
             )
          ;
          simplifyStructure(parse(input)).should.deep.equal(expected.ast);
        })
      ))
      /* eslint-enable no-use-before-define */
    );
  });
});
