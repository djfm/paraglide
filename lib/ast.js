const {
  isTree,
} = require('./parsing');

const ast = parserOutput => {
  if (!parserOutput.tag.recognized) {
    throw new Error(
      'Cannot convert unrecognized parser output to AST.'
    );
  }

  const simplifyNodes = nodes => nodes.map(
    node => (
      isTree(node) ?
        ({ type: node.tag.type, nodes: simplifyNodes(node.nodes) }) :
        node
    )
  );

  const simplifiedNodes = simplifyNodes(parserOutput.nodes);

  if (simplifiedNodes.length !== 1) {
    throw new Error(
      'Something strange happend during conversion to AST.'
    );
  }

  return simplifiedNodes[0];
};

module.exports = {
  ast,
};
