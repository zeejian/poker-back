
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function drawCards(nrOfCards) {
    outCards = [];
    for (var i = 0; i < nrOfCards; i++) {
      let index = getRandomCardIndex();
      outCards.push(cards[index]);
      cards.splice(index, 1);
    }
    return outCards;
  }

function makeDeck() {
  var i;
  var j = 0;
  for (i = 2; i < 15; i++) {
    cards[j++] = 'h' + i;
    cards[j++] = 'd' + i;
    cards[j++] = 'c' + i;
    cards[j++] = 's' + i;
  }
}

function updatePlayerHoleCards(player) {
  let index = getRandomCardIndex();
  player.carda = cards[index];
  cards.splice(index, 1);

  index = getRandomCardIndex(cards);
  player.cardb = cards[index];
  cards.splice(index, 1);
}

function getRandomCardIndex() {
  random_ind = randomIntFromInterval(0, cards.length - 1);
  return random_ind;
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getNextPlayer(player) {
    for(let i=parseInt(player.pos_id)+1; i<8; i++){
      for(let j = 0; j<playerList.length; j++){
        if(parseInt(playerList[j].pos_id) === i && playerList[j].status == 'active'){
          return playerList[j];
        }
      }
    }
    for(let i=1; i<parseInt(player.pos_id); i++){
      for(let j = 0; j<playerList.length; j++){
        if(parseInt(playerList[j].pos_id) === i && playerList[j].status == 'active'){
          return playerList[j];
        }
      }
    }
}

module.exports = { sleep, makeDeck, getRandomCardIndex, updatePlayerHoleCards, drawCards, getNextPlayer };
