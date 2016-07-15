/**
 * "parserGenerator"s are functions that return a parser.
 */

const {
  sequence,
  allowFailure,
  first,
} = require('./parserEnhancers');

const {
  applyToRecognized,
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

  return first(
    applyToRecognized(transform)(
      allowFailure(
        sequence(
          eatStart,
          lazyly(groupBetween)(startPredicate, endPredicate, transform),
          eatEnd
        )
      )
    ),
    eatNeutralNodes
  );
};


module.exports = {
  groupBetween,
  eatWhile,
  eatExactlyOne,
};
