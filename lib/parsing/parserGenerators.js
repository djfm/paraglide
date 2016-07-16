/**
 * "parserGenerator"s are functions that return a parser.
 */

const {
  sequence,
  zeroOrMore,
} = require('./parserEnhancers');

const {
  applyToRecognized,
  ifNextNodeMatches,
} = require('./parserTransformers');

const {
  lazyly,
  noneOf,
  empty,
} = require('../functional');

const ParseError = require('./ParseError');

const eatWhile = predicate =>
  nodeList => {
    if (empty(nodeList)) {
      return { recognized: [], remaining: [] };
    }

    const [node, ...nextNodes] = nodeList;


    if (predicate(node)) {
      const {
        recognized: nextRecognized,
        remaining: nextRemaining,
      } = eatWhile(predicate)(nextNodes);

      return {
        recognized: [node, ...nextRecognized],
        remaining: nextRemaining,
      };
    }

    return {
      recognized: [],
      remaining: [...nodeList],
    };
  }
;

const eatExactlyOne = (predicate, expected) =>
  nodeList => {
    const [node, ...nextNodes] = nodeList;

    if (predicate(node)) {
      return {
        recognized: [node],
        remaining: nextNodes,
      };
    }

    throw new ParseError(
      `eatExactlyOne failed on ${node} while expecting ${expected}`
    );
  }
;

const groupBetween = (startPredicate, endPredicate, transform) => {
  const eatStart =
    eatExactlyOne(startPredicate, ':start')
  ;

  const eatNeutralNodes =
    eatWhile(noneOf(startPredicate, endPredicate))
  ;

  const eatEnd =
    eatExactlyOne(endPredicate, ':end')
  ;

  const eatGroup = applyToRecognized(transform)(
    sequence(
      eatStart,
      lazyly(groupBetween)(startPredicate, endPredicate, transform),
      eatEnd
    )
  );

  return zeroOrMore(
    sequence(
      eatNeutralNodes,
      ifNextNodeMatches(startPredicate)(eatGroup)
    )
  );
};


module.exports = {
  groupBetween,
  eatWhile,
  eatExactlyOne,
};
