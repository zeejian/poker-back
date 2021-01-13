const hand = require('../js/hand');

// test('testJs', () => {
//   expect(hand.testJs(['h13'])).toEqual('13');
// });

// test('testStraightFlush', () => {
//   expect(
//     hand.checkStraightFlush(['h13', 'h12', 'h11', 'h10', 'h9', 'h8'])
//   ).toEqual({
//     type: 'STRAIGHT_FLUSH',
//     card: ['h13', 'h12', 'h11', 'h10', 'h9'],
//   });

//   expect(
//     hand.checkStraightFlush(['h13', 'h12', 'h11', 'h10', 'h8', 'h7'])
//   ).toEqual({
//     type: 'FLUSH',
//     card: ['h13', 'h12', 'h11', 'h10', 'h8', 'h7'],
//   });

//   expect(
//     hand.checkStraightFlush(['h13', 'h11', 'h10', 'h9', 'h8', 'h7', 'h6'])
//   ).toEqual({
//     type: 'STRAIGHT_FLUSH',
//     card: ['h11', 'h10', 'h9', 'h8', 'h7'],
//   });
// });

// test('testFlush', () => {
//   expect(
//     hand.checkFlush(['h12', 'd12', 'h10', 'h3', 'h9', 'h8', 'h7'])
//   ).toEqual({ type: 'FLUSH', card: ['h12', 'h10', 'h9', 'h8', 'h7', 'h3'] });
// });

// test('test4ofaKind', () => {
//   expect(
//     hand.check4ofaKind(['h12', 's8', 's12', 'd12', 's6', 'c12', 'c3'])
//   ).toEqual({
//     type: '4_OF_A_KIND',
//     card: ['h12', 's12', 'd12', 'c12'],
//   });
// });

// test('testGetRestCards', () => {
//   expect(hand.getRestCards(['a', 'b'], ['a', 'b', 'c'])).toEqual(['c']);
// });

// test('testSet', () => {
//   expect(hand.checkSet(['c2', 'c5', 'd2', 's8', 's2', 's12'])).toEqual({
//     type: 'SET',
//     card: ['c2', 'd2', 's2'],
//   });
// });

// test('testStraight', ()=>{
//   expect(hand.checkStraight(['s10','d8','s7','c6','h5','h4','h3'])).toEqual({
//     type:'STRAIGHT',
//     card:['d8','s7','c6','h5','h4']
//   })
// })

// test('testPair', ()=>{
//   expect(hand.checkPair(['h13', 'c12', 'd10','c10', 'c8','c7'])).toEqual({
//     type:'PAIR',
//     card:['d10', 'c10']
//   })
// })

test('testAnalyze-1pair', ()=>{
  expect(hand.analyzeHand(['h13', 'c12', 'd10','c10', 'c8','c7'])).toEqual({
    type:'PAIR',
    card:['d10', 'c10']
  })
})

test('testAnalyze-2pair', ()=>{
  expect(hand.analyzeHand(['h13', 'c12', 'd10','c10', 'c8','d8'])).toEqual({
    type:'2PAIR',
    card:['d10', 'c10', 'c8','d8']
  })
})

test('testAnalyze-set', ()=>{
  expect(hand.analyzeHand(['h13', 'c12', 'd10','c10', 'h10','d8'])).toEqual({
    type:'SET',
    card:['d10', 'c10', 'h10']
  })
})

test('testAnalyze-straight', ()=>{
  expect(hand.analyzeHand(['h13', 'c12', 'd12','h12', 's11','d10','c9'])).toEqual({
    type:'STRAIGHT',
    card:['h13', 'c12', 's11','d10','c9']
  })
})

// test('testGenerateCardCombo', ()=>{
//   expect(hand.generateCardCombo(['h0', 'h1', 'h2','h3', 'h4','h5','h6'])).toEqual({
//     type:'STRAIGHT',
//     card:['h13', 'c12', 's11','d10','c9']
//   })
// })
