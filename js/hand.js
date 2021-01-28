const HIGH_CARD = '0';
const PAIR = '1';
const TWO_PAIR = '2';
const SET = '3';
const STRAIGHT = '4';
const FLUSH = '5';
const FULL_HOUSE = '6';
const FOUR_OF_A_KIND = '7';
const STRAIGHT_FLUSH = '8';

function getAnalyzedHand(cards) {
  flush = checkFlush(cards);
  if (flush.type == FLUSH) {
    straightFlush = checkStraightFlush(flush.card);
    if (straightFlush.type == STRAIGHT_FLUSH) {
      //STRIGHT_FLUSH
      return straightFlush;
    } else {
      //FLUSH
      return { type: FLUSH, card: flush.card.slice(0, 5) };
    }
  } else {
    fourOfaKind = check4ofaKind(cards);
    if (fourOfaKind.type == FOUR_OF_A_KIND) {
      //4_OF_A_KIND
      return fourOfaKind;
    } else {
      aSet = checkSet(cards);
      if (aSet.type == SET) {
        //exclude 3 same cards
        restCards = getRestCards(aSet.card, cards);
        aPair = checkPair(restCards);
        if (aPair.type == PAIR) {
          //FULLHOUSE
          aFullHouse = [];
          aSet.card.forEach((e) => {
            aFullHouse.push(e);
          });
          aPair.card.forEach((e) => {
            aFullHouse.push(e);
          });
          return { type: FULL_HOUSE, card: aFullHouse };
        } else {
          //do nothing, if it is no fullhouse
          straight = checkStraight(cards);
          if (straight.type == STRAIGHT) {
            //STRAIGHT
            return straight;
          } else {
            rest = getRestCards(aSet.card, cards);
            sortedRest = sortNumber(rest);
            sortedRest.slice(0, 2).forEach((e) => {
              aSet.card.push(e);
            });
            return aSet;
          }
        }
      } else {
        straight = checkStraight(cards);
        if (straight.type == STRAIGHT) {
          //STRAIGHT
          return straight;
        } else {
          pair1 = checkPair(cards);
          if (pair1.type == PAIR) {
            restCards = getRestCards(pair1.card, cards);
            pair2 = checkPair(restCards);
            if (pair2.type == PAIR) {
              //2 PAIR
              twoPair = [];
              pair1.card.forEach((e) => {
                twoPair.push(e);
              });
              pair2.card.forEach((e) => {
                twoPair.push(e);
              });
              rest = getRestCards(pair2.card, restCards);
              sortedRest = sortNumber(rest);
              twoPair.push(sortedRest[0]);
              return { type: TWO_PAIR, card: twoPair };
            } else {
              // 1 PAIR
              rest = getRestCards(pair1.card, cards);
              sortedRest = sortNumber(rest);
              sortedRest.slice(0, 3).forEach((e) => {
                pair1.card.push(e);
              });
              return pair1;
            }
          } else {
            // HIGH_CARD
            return { type: HIGH_CARD, card: cards.slice(0, 5) };
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
      return { type: PAIR, card: pairCards };
    }
  }
  return { type: HIGH_CARD, card: cards };
}

function checkStraight(cards) {
  combo = generateCardCombo(cards);

  for (var i = 0; i < combo.length; i++) {
    stCards = [];
    stCards.push(combo[i][0]);
    //A,2,3,4,5 or 10,J,Q,K,A, A=14
    if (
      combo[i][1].slice(1) == combo[i][0].slice(1) - 1 ||
      combo[i][1].slice(1) == combo[i][0].slice(1) - 9
    ) {
      stCards.push(combo[i][1]);
    }

    for (var j = 2; j < 5; j++) {
      if (combo[i][j].slice(1) == combo[i][j - 1].slice(1) - 1) {
        stCards.push(combo[i][j]);
      } else {
        break;
      }
    }
    if (stCards.length == 5) {
      if (stCards[4].slice(1) == 2) {
        firstEle = stCards[0];
        stCards.splice(0, 1);
        stCards.push(firstEle);
      }
      return { type: STRAIGHT, card: stCards };
    }
  }
  return { type: HIGH_CARD, card: cards };
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
      return { type: SET, card: setCards };
    }
  }
  return { type: HIGH_CARD, card: cards };
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
      rest = getRestCards(fourOfaKindCards, cards);
      fourOfaKindCards.push(sortNumber(rest)[0]);
      return { type: FOUR_OF_A_KIND, card: fourOfaKindCards };
    }
  }
  return { type: HIGH_CARD, card: cards };
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
      return { type: STRAIGHT_FLUSH, card: sfCards };
    }
  }
  return { type: FLUSH, card: cards };
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
    return { type: FLUSH, card: sortNumber(hearts) };
  } else if (spades.length >= 5) {
    return { type: FLUSH, card: sortNumber(spades) };
  } else if (diamonds.length >= 5) {
    return { type: FLUSH, card: sortNumber(diamonds) };
  } else if (clubs.length >= 5) {
    return { type: FLUSH, card: sortNumber(clubs) };
  } else {
    return { type: HIGH_CARD, card: cards };
  }
}

function sortNumber(cards) {
  cards.sort((a, b) => {
    return b.slice(1) - a.slice(1);
  });
  return cards;
}
//compare 2 hands, return the player with better hand
function compareHands(player1, player2) {
  if (player1.hand.type == player2.hand.type) {
    index = 0;
    return getMaxCardPlayer(player1, player2, index);
  } else {
    return [player1];
  }
}

function getMaxCardPlayer(player1, player2, ind) {
  winners = [];
  if (player1.hand.card[ind].slice(1) == player2.hand.card[ind].slice(1)) {
    ind++;
    if (ind != 4) {
      return getMaxCardPlayer(player1, player2, ind);
    } else {
      winners.push(player1);
      winners.push(player2);
    }
  } else if (
    player1.hand.card[ind].slice(1) > player2.hand.card[ind].slice(1)
  ) {
    winners.push(player1);
  } else {
    winners.push(player2);
  }
  return winners;
}

function getWinners(playerList) {
  winnerArr = [];
  for (var ind = 1; ind < playerList.length; ind++) {
    winner = compareHands(playerList[ind - 1], playerList[ind]);
    if (ind == 1) {
      winnerArr.push(winner[0]);
    }
    if (winner.length > 1) {
      winnerArr.push(winner[1]);
    } else {
      break;
    }
  }
  return winnerArr;
}

function getRankedPlayers(pList) {
  pList.sort((a, b) => {
    if (a.hand.type != b.hand.type) {
      return b.hand.type - a.hand.type;
    } else {
      if (a.hand.card[0].slice(1) != b.hand.card[0].slice(1)) {
        return b.hand.card[0].slice(1) - a.hand.card[0].slice(1);
      } else {
        if (a.hand.card[1].slice(1) != b.hand.card[1].slice(1)) {
          return b.hand.card[1].slice(1) - a.hand.card[1].slice(1);
        } else {
          if (a.hand.card[1].slice(1) != b.hand.card[1].slice(1)) {
            return b.hand.card[1].slice(1) - a.hand.card[1].slice(1);
          } else {
            if (a.hand.card[2].slice(1) != b.hand.card[2].slice(1)) {
              return b.hand.card[2].slice(1) - a.hand.card[2].slice(1);
            } else {
              if (a.hand.card[3].slice(1) != b.hand.card[3].slice(1)) {
                return b.hand.card[3].slice(1) - a.hand.card[3].slice(1);
              } else {
                if (a.hand.card[4].slice(1) != b.hand.card[4].slice(1)) {
                  return b.hand.card[4].slice(1) - a.hand.card[4].slice(1);
                } else {
                  a.hand.hasTie = true;
                  b.hand.hasTie = true;
                }
              }
            }
          }
        }
      }
    }
  });
  return pList;
}

function getPotsAllocation(rankedPlayers) {
  var currentPot = { potOwner: rankedPlayers, pot: 0 };
  potArr = [];

  while (currentPot.potOwner.length > 2) {
    potOwners = [];
    potSize = 0;
    pList = sortByTotalBet(rankedPlayers);
    minBet = pList[0].total_bet;

    for (var ind = 0; ind < rankedPlayers.length; ind++) {
      if (rankedPlayers[ind].total_bet != 0) {
        potOwners.push(rankedPlayers[ind]);
        potSize = potSize + minBet;
      }
    }
    currentPot = { potOwner: potOwners, pot: potSize };
    potArr.push(currentPot);

    updateTotalBet(rankedPlayers, minBet);
  }
  return potArr;
}

function distributeChips(rankedPlayers) {
  potsAlloc = getPotsAllocation(rankedPlayers);
  for (var i = 0; i < potsAlloc.length; i++) {
    if ('hasTie' in potsAlloc[i].potOwner[0]) {
      //Tie , split pot scenario
      counter = 1;
      potWinners = [];
      potWinners.push(potsAlloc[i].potOwner[0]);
      for (var j = 1; j < potsAlloc[i].potOwner.length; j++) {
        if ('hasTie' in potsAlloc[i].potOwner[1]) {
          counter++;
          potWinners.push(potsAlloc[i].potOwner[j]);
        }
      }
      potWinners.forEach((e) => {
        e.chips = potsAlloc[i].pot / counter;
      });
    } else {
      // pot winner takes all
      potsAlloc[i].potOwner[0].chips = potsAlloc[i].pot;
    }
  }
  return rankedPlayers;
}
function updateTotalBet(rankedPlayers, minBet) {
  //update total_bet
  for (var i = 0; i < rankedPlayers.length; i++) {
    if (rankedPlayers[i].total_bet - minBet >= 0) {
      rankedPlayers[i].total_bet = rankedPlayers[i].total_bet - minBet;
    }
  }
}

function sortByTotalBet(players) {
  players.sort((a, b) => {
    return a.total_bet - b.total_bet;
  });
  for (var i = 0; i < players.length; i++) {
    if (players[i].total_bet != 0) {
      return players.slice(i);
    }
  }
  return players;
}

//module.exports = server;
module.exports = {
  testJs,
  check4ofaKind,
  checkFlush,
  checkStraightFlush,
  getAnalyzedHand,
  getRestCards,
  checkSet,
  checkPair,
  checkStraight,
  generateCardCombo,
  compareHands,
  getWinners,
  getRankedPlayers,
  getPotsAllocation,
  sortByTotalBet,
  distributeChips,
};
