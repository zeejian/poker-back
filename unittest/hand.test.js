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

test('testAnalyze-1pair', () => {
  expect(
    hand.getAnalyzedHand(['h13', 'c12', 'd10', 'c10', 'c8', 'c7'])
  ).toEqual({
    type: '1',
    card: ['d10', 'c10', 'h13', 'c12', 'c8'],
  });
});

test('testAnalyze-2pair', () => {
  expect(
    hand.getAnalyzedHand(['h13', 'c12', 'd10', 'c10', 'c8', 'd8'])
  ).toEqual({
    type: '2',
    card: ['d10', 'c10', 'c8', 'd8', 'h13'],
  });
});

test('testAnalyze-set', () => {
  expect(
    hand.getAnalyzedHand(['h13', 'c12', 'd10', 'c10', 'h10', 'd8'])
  ).toEqual({
    type: '3',
    card: ['d10', 'c10', 'h10', 'h13', 'c12'],
  });
});

test('testAnalyze-straight', () => {
  expect(
    hand.getAnalyzedHand(['h13', 'c12', 'd12', 'h12', 's11', 'd10', 'c9'])
  ).toEqual({
    type: '4',
    card: ['h13', 'c12', 's11', 'd10', 'c9'],
  });

  expect(
    hand.getAnalyzedHand(['h14', 'c12', 'd12', 'c5', 's4', 'd3', 'c2'])
  ).toEqual({
    type: '4',
    card: ['c5', 's4', 'd3', 'c2', 'h14'],
  });

  expect(
    hand.getAnalyzedHand(['h14', 'c13', 'd12', 'c5', 's11', 'd10', 'c9'])
  ).toEqual({
    type: '4',
    card: ['h14', 'c13', 'd12', 's11', 'd10'],
  });
});

test('testAnalyze-flush', () => {
  expect(
    hand.getAnalyzedHand(['h13', 'h12', 'd12', 's11', 'h10', 'h3', 'h2'])
  ).toEqual({
    type: '5',
    card: ['h13', 'h12', 'h10', 'h3', 'h2'],
  });
});

test('testCompareHands', () => {
  expect(
    hand.compareHands(
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['c13', 'c12', 'c10', 's3', 's2'] },
      }
    )
  ).toEqual([
    {
      player_id: '1',
      hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
    },
    {
      player_id: '2',
      hand: { type: '0', card: ['c13', 'c12', 'c10', 's3', 's2'] },
    },
  ]);

  expect(
    hand.compareHands(
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['c13', 'c12', 'c10', 's3', 's2'] },
      }
    ).length
  ).toBe(2);

  expect(
    hand.compareHands(
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's11', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['c13', 'c12', 'c10', 's3', 's2'] },
      }
    )
  ).toEqual([
    {
      player_id: '1',
      hand: { type: '0', card: ['h13', 'h12', 's11', 'h3', 'h2'] },
    },
  ]);

  expect(
    hand.compareHands(
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's11', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['c13', 'c12', 'd12', 's3', 's2'] },
      }
    )
  ).toEqual([
    {
      player_id: '2',
      hand: { type: '0', card: ['c13', 'c12', 'd12', 's3', 's2'] },
    },
  ]);
});

test('testGetWinners', () => {
  expect(
    hand.getWinners([
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['c13', 'c12', 'c10', 's3', 's2'] },
      },
      {
        player_id: '3',
        hand: { type: '0', card: ['d13', 'd12', 'h10', 'c3', 'd2'] },
      },
    ])
  ).toEqual([
    {
      player_id: '1',
      hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
    },
    {
      player_id: '2',
      hand: { type: '0', card: ['c13', 'c12', 'c10', 's3', 's2'] },
    },
    {
      player_id: '3',
      hand: { type: '0', card: ['d13', 'd12', 'h10', 'c3', 'd2'] },
    },
  ]);

  expect(
    hand.getWinners([
      {
        player_id: '1',
        hand: { type: '1', card: ['h12', 'd12', 'c9', 'c8', 's5'] },
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['h12', 'd10', 'c9', 'c8', 'c7'] },
      },
    ])
  ).toEqual([
    {
      player_id: '1',
      hand: { type: '1', card: ['h12', 'd12', 'c9', 'c8', 's5'] },
    },
  ]);
});

test('testGetRankedPlayers', () => {
  expect(
    hand.getRankedPlayers([
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
      },
      {
        player_id: '3',
        hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
      },
    ])
  ).toEqual([
    {
      player_id: '3',
      hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
    },
    {
      player_id: '2',
      hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
    },

    {
      player_id: '1',
      hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
    },
  ]);

  expect(
    hand.getRankedPlayers([
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
      },
      {
        player_id: '3',
        hand: { type: '1', card: ['d13', 'd12', 'h11', 'c3', 'd2'] },
      },
    ])
  ).toEqual([
    {
      player_id: '3',
      hand: { type: '1', card: ['d13', 'd12', 'h11', 'c3', 'd2'] },
    },
    {
      player_id: '2',
      hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
    },

    {
      player_id: '1',
      hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
    },
  ]);

  expect(
    hand.getRankedPlayers([
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['c13', 'c12', 'c10', 's3', 's2'] },
      },
      {
        player_id: '3',
        hand: { type: '0', card: ['d13', 'd12', 'h10', 'c3', 'd2'] },
      },
    ])
  ).toEqual([
    {
      player_id: '1',
      hand: {
        type: '0',
        card: ['h13', 'h12', 's10', 'h3', 'h2'],
        hasTie: true,
      },
    },
    {
      player_id: '2',
      hand: {
        type: '0',
        card: ['c13', 'c12', 'c10', 's3', 's2'],
        hasTie: true,
      },
    },
    {
      player_id: '3',
      hand: {
        type: '0',
        card: ['d13', 'd12', 'h10', 'c3', 'd2'],
        hasTie: true,
      },
    },
  ]);
});

test('testGetRankedPlayers', () => {
  expect(
    hand.getRankedPlayers([
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
        total_bet: 50,
      },
      {
        player_id: '2',
        hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
        total_bet: 20,
      },
      {
        player_id: '3',
        hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
        total_bet: 10,
      },
    ])
  ).toEqual([
    {
      player_id: '3',
      hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
      total_bet: 10,
    },
    {
      player_id: '2',
      hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
      total_bet: 20,
    },

    {
      player_id: '1',
      hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      total_bet: 50,
    },
  ]);
});

test('testGetPotsAllocation', () => {
  expect(
    hand.getPotsAllocation([
      {
        player_id: '1',
        hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
        total_bet: 50,
      },
      {
        player_id: '2',
        hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
        total_bet: 100,
      },
      {
        player_id: '3',
        hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
        total_bet: 200,
      },
      {
        player_id: '4',
        hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
        total_bet: 300,
      },
    ])
  ).toEqual([
    {
      potOwner: [
        {
          player_id: '1',
          hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
          total_bet: 0,
        },
        {
          player_id: '2',
          hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
          total_bet: 0,
        },
        {
          player_id: '3',
          hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 0,
        },
        {
          player_id: '4',
          hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 0,
        },
      ],
      pot: 200,
    },
    {
      potOwner: [
        {
          player_id: '2',
          hand: { type: '1', card: ['c13', 'c12', 'c10', 's4', 's2'] },
          total_bet: 0,
        },
        {
          player_id: '3',
          hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 0,
        },
        {
          player_id: '4',
          hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 0,
        },
      ],
      pot: 150,
    },
    {
      potOwner: [
        {
          player_id: '3',
          hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 0,
        },
        {
          player_id: '4',
          hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 0,
        },
      ],
      pot: 200,
    },
    {
      potOwner: [
        {
          player_id: '4',
          hand: { type: '1', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 0,
        },
      ],
      pot: 100,
    },
  ]);

  expect(
    hand.getPotsAllocation([
      {
        player_id: '1',
        hand: { type: '1', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
        total_bet: 20,
      },
      {
        player_id: '2',
        hand: { type: '0', card: ['c13', 'c12', 'c10', 's4', 's2'] },
        total_bet: 20,
      },
    ])
  ).toEqual([
    {
      potOwner: [
        {
          player_id: '1',
          hand: { type: '1', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
          total_bet: 0,
        },
        {
          player_id: '2',
          hand: { type: '0', card: ['c13', 'c12', 'c10', 's4', 's2'] },
          total_bet: 0,
        },
      ],
      pot: 40,
    },
  ]);
});

test('testDistributeChips', () => {
  expect(
    hand.distributeChips(
      [
        {
          player_id: '1',
          hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
          total_bet: 50,
        },
        {
          player_id: '2',
          hand: { type: '0', card: ['c13', 'c12', 'c10', 's4', 's2'] },
          total_bet: 100,
        },
        {
          player_id: '3',
          hand: { type: '0', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 200,
        },
        {
          player_id: '4',
          hand: { type: '0', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
          total_bet: 300,
        },
      ],
      [
        {
          player_id: '5',
          hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
          total_bet: 80,
        },
        {
          player_id: '6',
          hand: { type: '0', card: ['c13', 'c12', 'c10', 's4', 's2'] },
          total_bet: 120,
        },
      ]
    )
  ).toEqual([
    {
      player_id: '1',
      hand: { type: '0', card: ['h13', 'h12', 's10', 'h3', 'h2'] },
      total_bet: 0,
      chips: 300,
    },
    {
      player_id: '2',
      hand: { type: '0', card: ['c13', 'c12', 'c10', 's4', 's2'] },
      total_bet: 0,
      chips: 230,
    },
    {
      player_id: '3',
      hand: { type: '0', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
      total_bet: 0,
      chips: 220,
    },
    {
      player_id: '4',
      hand: { type: '0', card: ['d14', 'd12', 'h10', 'c3', 'd2'] },
      total_bet: 0,
      chips: 100,
    },
  ]);
});

// test('testGenerateCardCombo', ()=>{
//   expect(hand.generateCardCombo(['h0', 'h1', 'h2','h3', 'h4','h5','h6'])).toEqual({
//     type:'STRAIGHT',
//     card:['h13', 'c12', 's11','d10','c9']
//   })
// })
