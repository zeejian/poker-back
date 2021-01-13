const hand = require('../js/hand');

test('testJs', () => {
  expect(hand.testJs(['h13'])).toEqual('13');
});

test('testStraightFlush', () => {
  expect(
    hand.checkStraightFlush(['h13', 'h12', 'h11', 'h10', 'h9', 'h8'])
  ).toEqual({
    type: 'STRAIGHT_FLUSH',
    card: ['h13', 'h12', 'h11', 'h10', 'h9'],
  });

  expect(
    hand.checkStraightFlush(['h13', 'h12', 'h11', 'h10', 'h8', 'h7'])
  ).toEqual({
    type: 'FLUSH',
    card: ['h13', 'h12', 'h11', 'h10', 'h8', 'h7'],
  });

  expect(
    hand.checkStraightFlush(['h13', 'h11', 'h10', 'h9', 'h8', 'h7', 'h6'])
  ).toEqual({
    type: 'STRAIGHT_FLUSH',
    card: ['h11', 'h10', 'h9', 'h8', 'h7'],
  });
});

test('testFlush', () => {
  expect(
    hand.checkFlush(['h12', 'd12', 'h10', 'h3', 'h9', 'h8', 'h7'])
  ).toEqual({ type: 'FLUSH', card: ['h12', 'h10', 'h9', 'h8', 'h7', 'h3'] });
});

test('test4ofaKind', () => {
  expect(
    hand.check4ofaKind(['h12', 's8', 's12', 'd12', 's6', 'c12', 'c3'])
  ).toEqual({
    type: '4_OF_A_KIND',
    card: ['h12', 's12', 'd12', 'c12'],
  });
});

test('testGetRestCards', () => {
  expect(hand.getRestCards(['a', 'b'], ['a', 'b', 'c'])).toEqual(['c']);
});
