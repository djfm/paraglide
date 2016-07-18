/**
 * "parserGenerator"s are functions that return a parser.
 */

const {
  sequence,
  zeroOrMore,
  first,
} = require('./parserEnhancers');

const {
  applyToRecognized,
} = require('./parserTransformers');

const {
  lazyly,
  noneOf,
  empty,
  not,
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
      `eatExactlyOne failed on "${node}" while expecting "${expected}"`
    );
  }
;

const groupBetween = (startPredicate, endPredicate, transform) => {
  const parser = () => first(
    applyToRecognized(transform)(
      sequence(
        eatExactlyOne(startPredicate, ':start'),
        lazyly(parser)(),
        eatExactlyOne(endPredicate, ':end')
      )
    ),
    eatWhile(noneOf(startPredicate, endPredicate))
  );

  return zeroOrMore(parser());
};

/**
 * This should be a good description, but it won't work IRL.
 * Why?
 */

/* eslint-disable no-unused-vars */
const idealGroupBetween = (startPredicate, endPredicate, transform) =>
  zeroOrMore(
    sequence(
      eatWhile(not(startPredicate)),
      applyToRecognized(transform)(
        sequence(
          eatExactlyOne(startPredicate, ':start'),
          lazyly(groupBetween)(startPredicate, endPredicate, transform),
          eatExactlyOne(endPredicate, ':end')
        )
      )
    )
  )
;
/* eslint-enable no-unused-vars */

/*
const log = parserGenerator =>
  (...generatorArgs) => nodeList => {
    const result = parserGenerator(...generatorArgs)(nodeList);
    console.log(result);
    return result;
  }
;*/

module.exports = {
  groupBetween,
  eatWhile,
  eatExactlyOne,
};
