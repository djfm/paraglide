# Parsing Utility Functions

## Parsers

A *parser* is a function that accepts
an iterable (and other arguments if it wishes so),
and returns an object with the following properties:

- recognized: an *iterable* of nodes that the parser recognized
- remaining: an *iterable* of nodes that the parser doesn't care about

## Parser Enhancers

A *parser enhancer* is a function that accepts one or more parsers
and returns a new parser.

## Parser Generators

A *parser generator* is a function
that takes any kind of arguments and returns a parser.

They're typically used to build parsers and use them with parser enhancers.
