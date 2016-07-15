/**
 * "parserGenerator"s are functions that return a parser.
 */

const {
  zeroOrMore,
  sequence,
} = require('./parserEnhancers');

const {
  applyToRecognized,
} = require('./parserTransformers');

const {
  lazyly,
  not,
} = require('../functional');

const ParseError = require('./ParseError');

const eatWhile = predicate =>
  nodeList => {
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
      remaining: nodeList,
    };
  }
;

const eatExactlyOne = predicate =>
  nodeList => {
    const [node, ...nextNodes] = nodeList;

    if (predicate(node)) {
      return {
        recognized: [node],
        remaining: nextNodes,
      };
    }

    throw new ParseError();
  }
;

const groupBetween = (startPredicate, endPredicate, transform) =>
  sequence(
    eatWhile(not(startPredicate)),
    applyToRecognized(transform)(
      sequence(
        eatExactlyOne(startPredicate),
        lazyly(groupBetween)(startPredicate, endPredicate, transform),
        eatExactlyOne(endPredicate)
      )
    )
  )
;


module.exports = {
  groupBetween,
  eatWhile,
  eatExactlyOne,
};
