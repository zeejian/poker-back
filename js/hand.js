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
        restCards = getRestCards(aSet.cards, cards);
        aPair = checkPair(restCards);
        if (aPair.type == 'PAIR') {
          //FULLHOUSE
          aFullHouse = [];
          aSet.forEach((e) => {
            aFullHouse.push(e);
          });
          aPair.forEach((e) => {
            aFullHouse.push(e);
          });
          return { type: 'FULLHOUSE', card: aFullHouse };
        } else {
          //do nothing, if it is no fullhouse
        }
      } else {
        straight = checkStraight(cards);
        if (straight.type == 'STRAIGHT') {
          //STRAIGHT
          return straight;
        } else if (aSet.type == 'SET') {
          return { type: 'SET', card: aSet };
        } else {
          pair1 = checkPair(cards);
          if (pair1.type == 'PAIR') {
            restCards = getRestCards(pair1.cards, cards);
            pair2 = checkPair(restCards);
            if (pair2.type == 'PAIR') {
              //2 PAIR
              twoPair = [];
              pair1.forEach((e) => {
                twoPair.push(e);
              });
              pair2.forEach((e) => {
                twoPair.push(e);
              });
              return { type: '2PAIR', card: twoPair };
            } else {
              // 1 PAIR
              return { type: 'PAIR', card: pair1 };
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
    for (var i = j + 1; i < cards.length; i++) {
      pairCards.push(cards[j]);
      if (cards[j].slice(1) == cards[i].slice(1)) {
        pairCards.push(cards[i]);
      }
    }
    if (pairCards.length == 3) {
      return { type: 'PAIR', card: pairCards };
    }
  }
  return { type: 'HIGH_CARD', card: cards };
}

function checkStraight(cards) {
  for (var j = 0; j < cards.length - 4; j++) {
    stCards = [];
    for (var i = j; i < j + 4; i++) {
      if (cards[i + 1].slice(1) == cards[i].slice(1) - 1) {
        stCards.push(cards[i]);
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

function getRestCards(small, whole) {
  let diff = whole.filter((x) => !small.includes(x));
  return diff;
}
function checkSet(cards) {
  for (var j = 0; j < cards.length - 2; j++) {
    setCards = [];
    for (var i = j + 1; i < cards.length; i++) {
      setCards.push(cards[j]);
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
};
