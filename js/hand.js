function analyzeHand(cards) {
  flush = checkFlush(cards);
  if (flush.type == 'FLUSH') {
    straightFlush = checkStraightFlush(flush.card);
    if (straightFlush.type == 'STRAIGHT_FLUSH') {
      //STRIGHT_FLUSH
      return straightFlush;
    } else {
      //FLUSH
      return { type: 'FLUSH', card: flush.card.slice(0, 5) };
    }
  } else {
    fourOfaKind = check4ofaKind(cards);
    if (fourOfaKind.type == '4_OF_A_KIND') {
      //4_OF_A_KIND
      return fourOfaKind;
    } else {
      aSet = checkSet(cards);
      if (aSet.type == 'SET') {
        //exclude 3 same cards
        restCards = getRestCards(aSet.card, cards);
        aPair = checkPair(restCards);
        if (aPair.type == 'PAIR') {
          //FULLHOUSE
          aFullHouse = [];
          aSet.card.forEach((e) => {
            aFullHouse.push(e);
          });
          aPair.card.forEach((e) => {
            aFullHouse.push(e);
          });
          return { type: 'FULLHOUSE', card: aFullHouse };
        } else {
          //do nothing, if it is no fullhouse
          straight = checkStraight(cards);
          if (straight.type == 'STRAIGHT') {
            //STRAIGHT
            return straight;
          } else {
            return aSet;
          }
        }
      } else {
        straight = checkStraight(cards);
        if (straight.type == 'STRAIGHT') {
          //STRAIGHT
          return straight;
        } else {
          pair1 = checkPair(cards);
          if (pair1.type == 'PAIR') {
            restCards = getRestCards(pair1.card, cards);
            pair2 = checkPair(restCards);
            if (pair2.type == 'PAIR') {
              //2 PAIR
              twoPair = [];
              pair1.card.forEach((e) => {
                twoPair.push(e);
              });
              pair2.card.forEach((e) => {
                twoPair.push(e);
              });
              return { type: '2PAIR', card: twoPair };
            } else {
              // 1 PAIR
              return pair1;
            }
          } else {
            // HIGH_CARD
            return { type: 'HIGH_CARD', card: cards };
          }
        }
      }
    }
  }
}

function checkPair(cards) {
  for (var j = 0; j < cards.length - 1; j++) {
    pairCards = [];
    pairCards.push(cards[j]);
    for (var i = j + 1; i < cards.length; i++) {
      if (cards[j].slice(1) == cards[i].slice(1)) {
        pairCards.push(cards[i]);
      }
    }
    if (pairCards.length == 2) {
      return { type: 'PAIR', card: pairCards };
    }
  }
  return { type: 'HIGH_CARD', card: cards };
}

function checkStraight(cards) {
  combo = generateCardCombo(cards);

  for (var i = 0; i < combo.length; i++) {
    stCards = [];
    stCards.push(combo[i][0]);
    for (var j = 1; j < 5; j++) {
      if (combo[i][j].slice(1) == combo[i][j - 1].slice(1) - 1) {
        stCards.push(combo[i][j]);
      } else {
        break;
      }
    }
    if (stCards.length == 5) {
      return { type: 'STRAIGHT', card: stCards };
    }
  }
  return { type: 'HIGH_CARD', card: cards };
}

//generate C(7, 5)
function generateCardCombo(cards) {
  res = [];
  for (var i = cards.length - 1; i >= 1; i--) {
    rest1 = cards.slice(0, i);
    rest2 = cards.slice(i + 1, cards.length);
    for (var j = i - 1; j >= 0; j--) {
      first = rest1.slice(0, j);
      second = [];
      if (j != i - 1) {
        second = rest1.slice(j + 1, i);
      }
      second.forEach((e) => {
        first.push(e);
      });
      rest2.forEach((e) => {
        first.push(e);
      });
      res.push(first);
    }
  }
  return res;
}

function getRestCards(small, whole) {
  let diff = whole.filter((x) => !small.includes(x));
  return diff;
}
function checkSet(cards) {
  for (var j = 0; j < cards.length - 2; j++) {
    setCards = [];
    setCards.push(cards[j]);
    for (var i = j + 1; i < cards.length; i++) {
      if (cards[j].slice(1) == cards[i].slice(1)) {
        setCards.push(cards[i]);
      }
    }
    if (setCards.length == 3) {
      return { type: 'SET', card: setCards };
    }
  }
  return { type: 'HIGH_CARD', card: cards };
}

function check4ofaKind(cards) {
  for (var j = 0; j < cards.length - 3; j++) {
    fourOfaKindCards = [];
    fourOfaKindCards.push(cards[j]);
    for (var i = j + 1; i < cards.length; i++) {
      if (cards[j].slice(1) == cards[i].slice(1)) {
        fourOfaKindCards.push(cards[i]);
      }
    }
    if (fourOfaKindCards.length == 4) {
      return { type: '4_OF_A_KIND', card: fourOfaKindCards };
    }
  }
  return { type: 'HIGH_CARD', card: cards };
}

function checkStraightFlush(cards) {
  //sort cards big to small, first hit possible biggist straightflush
  for (var j = 0; j < cards.length - 4; j++) {
    sfCards = [];
    sfCards.push(cards[j]);
    for (var i = j + 1; i < j + 5; i++) {
      if (parseInt(cards[i].slice(1)) == parseInt(cards[i - 1].slice(1)) - 1) {
        sfCards.push(cards[i]);
      } else {
        break;
      }
    }
    if (sfCards.length == 5) {
      return { type: 'STRAIGHT_FLUSH', card: sfCards };
    }
  }
  return { type: 'FLUSH', card: cards };
}

function testJs(cards) {
  return cards[0].slice(1);
}

function checkFlush(cards) {
  hearts = [];
  spades = [];
  diamonds = [];
  clubs = [];

  cards.forEach((e) => {
    suit = e.slice(0, 1);
    if (suit == 'h') {
      hearts.push(e);
    } else if (suit == 's') {
      spades.push(e);
    } else if (suit == 'd') {
      diamonds.push(e);
    } else if (suit == 'c') {
      clubs.push(e);
    }
  });

  if (hearts.length >= 5) {
    return { type: 'FLUSH', card: sortNumber(hearts) };
  } else if (spades.length >= 5) {
    return { type: 'FLUSH', card: sortNumber(spades) };
  } else if (diamonds.length >= 5) {
    return { type: 'FLUSH', card: sortNumber(diamonds) };
  } else if (clubs.length >= 5) {
    return { type: 'FLUSH', card: sortNumber(clubs) };
  } else {
    return { type: 'HIGH_CARD', card: cards };
  }
}

function sortNumber(cards) {
  cards.sort((a, b) => {
    return b.slice(1) - a.slice(1);
  });
  return cards;
}

//module.exports = server;
module.exports = {
  testJs,
  check4ofaKind,
  checkFlush,
  checkStraightFlush,
  analyzeHand,
  getRestCards,
  checkSet,
  checkPair,
  checkStraight,
  generateCardCombo,
};
