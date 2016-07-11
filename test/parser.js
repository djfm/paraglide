const { examples } = require('./harness/examples');
const { deepMap } = require('../lib/functional');

const {
  groupNodes,
  groupBetween,
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

    describe('groupBetween "(" and ")"', () => {
      const checkNodeStructures = checkNodeStructuresAfter(
        groupBetween(/^\($/, /^\)$/, 'parenGroup')
      );

      checkNodeStructures('a', ['sourceString']);
      checkNodeStructures('ab', ['sourceString', 'sourceString']);
      checkNodeStructures('()', ['parenGroup[]']);
      checkNodeStructures('(a)', ['parenGroup[sourceString]']);
      checkNodeStructures('(ab)', ['parenGroup[sourceString, sourceString]']);
      checkNodeStructures('(())', ['parenGroup[parenGroup[]]']);
      checkNodeStructures('((a))', ['parenGroup[parenGroup[sourceString]]']);
      checkNodeStructures('((ab))', ['parenGroup[parenGroup[sourceString, sourceString]]']);
      checkNodeStructures('(()())', ['parenGroup[parenGroup[], parenGroup[]]']);
      checkNodeStructures(
        '((a)(b))',
        ['parenGroup[parenGroup[sourceString], parenGroup[sourceString]]']
      );
      checkNodeStructures(
        '((a)((b)))',
        ['parenGroup[parenGroup[sourceString], parenGroup[parenGroup[sourceString]]]']
      );
      checkNodeStructures(
        '((a)(b)(c))',
        ['parenGroup[parenGroup[sourceString], parenGroup[sourceString], parenGroup[sourceString]]']
      );
      checkNodeStructures('a(b)', ['sourceString', 'parenGroup[sourceString]']);
    });

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
      checkNodeStructures('(f(b))',
        ['parenGroup[sourceString, parenGroup[sourceString]]']
      );
    });

    describe('groupStage', () => {
      const checkNodeStructures = checkNodeStructuresAfter(groupStage);

      checkNodeStructures('1 + 2', ['application[operator, number, number]']);
      checkNodeStructures('1 + 2 + 3',
        ['application[operator, application[operator, number, number], number]']
      );
    });
  });

  context('language domain', () => {
    examples.forEach((folder, folderName) =>
      context(folderName, () => folder.forEach(
        ({ input, expected }, name) => it(`should parse a ${name}`, () => {
          const simplifyStructure = node =>
            deepMap(node, value => {
              if (typeof value === 'object' && 'children' in value) {
                const valueCopy = Object.assign({}, value);
                delete valueCopy.children;
                return valueCopy;
              }
              return value;
            })
          ;
          simplifyStructure(parse(input)).should.deep.equal(expected.ast);
        })
      ))
    );
  });
});
