const { examples } = require('./harness/examples');
const { deepMap } = require('../lib/functional');

const {
  groupNodes,
  mergeAdjacent,
  groupBetween,
  parse,
  compose,
  groupStage,
  stringToNodeList,
} = require('../lib/parser');

describe('The Parser', () => {
  context('internals', () => {
    describe('compose', () => {
      it('should successively apply parsers', () => {
        const a = () => [1, 2];
        const b = nodes => nodes.splice(1);
        const c = nodes => nodes.concat(3);
        compose(a, b, c)().should.deep.equal([2, 3]);
      });
    });

    const structureOf = nodeList => nodeList.map(
      ({ type, value }) =>
        ((value instanceof Array) ?
          `${type}[${structureOf(value).join(', ')}]` :
          type)
    );

    const checkNodeStructuresAfter = (parser, toNodeList = stringToNodeList) =>
      (sourceString, expectedNodeTypes) =>
        it(`should detect "${expectedNodeTypes.join(', ')}" when parsing "${sourceString}"`,
          () => {
            const nodes = parser(toNodeList(sourceString));
            try {
              structureOf(nodes).should.deep.equal(expectedNodeTypes);
            } catch (e) {
              console.log('Oops', JSON.stringify(nodes, null, 2));
              throw e;
            }
          }
        )
    ;

    describe('mergeAdjacent nodes of the "g" type', () => {
      const checkNodeStructures = checkNodeStructuresAfter(
        mergeAdjacent('g'),
        str => stringToNodeList(str).map(
          node => Object.assign({}, node, {
            type: node.value,
          })
        )
      );

      checkNodeStructures('a', ['a']);
      checkNodeStructures('ab', ['a', 'b']);
      checkNodeStructures('abc', ['a', 'b', 'c']);
      checkNodeStructures('g', ['g']);
      checkNodeStructures('gg', ['g']);
      checkNodeStructures('ggg', ['g']);
      checkNodeStructures('ag', ['a', 'g']);
      checkNodeStructures('aggggg', ['a', 'g']);
      checkNodeStructures('agggggbc', ['a', 'g', 'b', 'c']);
    });

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
