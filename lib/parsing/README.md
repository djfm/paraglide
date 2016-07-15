# Parsing

A *parser* is a function that accepts
an iterable (and other arguments if it wishes so),
and returns an object with the following properties:

- recognized: an *iterable* of nodes that the parser recognized
- remaining: an *iterable* of nodes that the parser doesn't care about
