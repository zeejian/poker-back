const express = require('express');
const { readFile } = require('fs');
var bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const getAnalyzedHand = require('./hand').getAnalyzedHand;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//globals
var playerList = [];
var communityCards = [];
var cards = new Array(52);
var socketToPlayerMap = new Map(); //(socket.id, Player)
var isGameOn = false;
var button;
var small;
var big;
var pot = 0;
var highestBet = 0;
var gameStage; //enum: preFlop, flop, turn, river

app.get('/', (request, response) => {
  readFile('./public/home.html', 'utf8', (err, html) => {
    if (err) {
      response.status(500).send('sorry, out of order');
    }
    response.send(html);
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log('App available on http://localhost:3000')
);

//////////////////////////////////////////////////////
/////   Receive request send response using http    //
//////////////////////////////////////////////////////

// app.post('/', (req, res) => {
//     const click = {clickTime: new Date()};
//     console.log(click);
//     console.log(req.header);
//     console.log(req.body);

//     //initial request from client,when clicking join game on seat, player seat number set from req
//     playerList.push(new player(req.body.playerId, req.body.name, "", 0, "", "", "", 0, 0))
//     if(playerList.length > 1){
//         join_game(playerList);
//         res.json(playerList);
//     } else {
//         console.log('waiting for other players to start game.')
//         //send the first player seat position
//         res.sendStatus(201);
//     }
// });

io.on('connection', function (socket) {
  socket.on('joinGameEvent', function (data) {
    console.log('A client sent us this dumb message:', data.player_id);

    onePlayer = new Player(
      parseInt(data.player_id),
      '',
      '',
      100,
      '',
      '',
      'inactive',
      0,
      0
    );
    playerList.push(onePlayer);
    socketToPlayerMap.set(socket.id, onePlayer);

    //wait for 1 second, if gameNotOn(if playerList>1, start game, otherwise only wait for other players), else do nothing.
    if (!isGameOn) {
      startGame(socket, io);
    } else {
      console.log('waiting for this round finish.');
    }
  });

  socket.on('playerActionFold', function (data) {
    console.log('received the user action fold event.');
    // if playerList length is less 3, start over; otherwise deregister the player(reset status)

    console.log('player with id: ' + data.player_id + ' folded.');
    updatePlayerStatus(parseInt(data.player_id), 'inactive');
    updatePlayerSubtotalBet(parseInt(data.player_id), 0);
    nrOfactivePlayers = getStatusPlayers('active').length;
    console.log('nubmer of active player is : ' + nrOfactivePlayers);

    //reset subtotal_bet, hasChecked!

    socket.emit('foldMsg', data.player_id);
    //fold the card as well?

    if (nrOfactivePlayers < 2) {
      //congrats winnner,

      //winner takes the pot,

      //wait for seconds to start new round

      console.log('this round ended.');
      isGameOn = false;
      if (!isGameOn) {
        startGame(socket, io);
      } else {
        //could it be 'fold' is hit but new game is started by new joined players
        console.log('new players are in.');
      }
    } else {
      // prompt next player
      console.log('this round continues.');
      next = getNextPlayer(getIdPlayer(parseInt(data.player_id)));
      sendToPlayer(socketToPlayerMap, next);
    }
  });

  socket.on('playerActionCall', function (data) {
    console.log('received the user action call event.');
    //calculate delta to call
    player = getIdPlayer(parseInt(data.player_id));

    if (highestBet > player.subtotal_bet) {
      updatePlayerBet(player.player_id, highestBet - player.subtotal_bet);
      next = getNextPlayer(player);
      //if the next players bet equals to highestBet,
      //we do not want to give the option 'call'?
      //if the next players bet is less than the highestBet, we dont give option 'check'?
      if (next.subtotal_bet == highestBet && next.player_id != big.player_id) {
        console.log('this is where we start dealing the next card(s)');
        if (gameStage != 'river') {
          dealCommunityCards();
          //reset highestBet and subtotal_bet to 0?
          for (var i = 0; i < playerList.length; i++) {
            if (playerList[i].status == 'active') {
              playerList[i].subtotal_bet = 0;
            }
          }
          highestBet = 0;

          //send options to the next player of button
          button = getRolePlayers('button')[0];
          sendToPlayer(socketToPlayerMap, getNextPlayer(button));
        } else {
          handleShowDown();
          gameStage = 'preFlop';
        }
      } else {
        sendToPlayer(socketToPlayerMap, next);
      }
    } else {
      socket.emit('callMsg', data.player_id);
      console.log(
        'this shouldnt happen that users: ' +
          player.player_id +
          ' bet is larger than highestBet.'
      );
    }
  });

  socket.on('playerActionCheck', function (data) {
    console.log('received the user action check event.');

    player = getIdPlayer(parseInt(data.player_id));
    if (highestBet == player.subtotal_bet) {
      if (player.subtotal_bet != 0) {
        // big blind to start the flop
        if (gameStage != 'river') {
          dealCommunityCards();
          //reset highestBet and subtotal_bet to 0?
          for (var i = 0; i < playerList.length; i++) {
            if (playerList[i].status == 'active') {
              playerList[i].subtotal_bet = 0;
            }
          }
          highestBet = 0;

          //send options to the next player of button
          button = getRolePlayers('button')[0];
          sendToPlayer(socketToPlayerMap, getNextPlayer(button)); //dont send call option
        } else {
          handleShowDown();
          gameStage = 'preFlop';
        }
      } else {
        //check done from small to button
        // new flag checked?
        if (getNextPlayer(player).hasChecked) {
          if (gameStage != 'river') {
            //deal
            dealCommunityCards();
            //reset hasChecked flag
            for (var i = 0; i < playerList.length; i++) {
              if (playerList[i].status == 'active') {
                playerList[i].hasChecked = false;
              }
            }
            button = getRolePlayers('button')[0];
            sendToPlayer(socketToPlayerMap, getNextPlayer(button)); //dont send call optio
          } else {
            handleShowDown();
            gameStage = 'preFlop';
          }
        } else {
          next = getNextPlayer(player);
          sendToPlayer(socketToPlayerMap, next);
          player.hasChecked = true;
        }
      }
    } else {
      socket.emit('checkMsg', data.player_id);
      console.log('you can not use option check.');
    }
  });
  //incoming data should contain player_id, betting amount
  socket.on('playerActionRaise', function (data) {
    console.log(
      'received the user action raise event, player id :' +
        data.player_id +
        ', betting amount:' +
        data.bet
    );
    //socket.emit('raiseMsg', data.player_id);

    player = getIdPlayer(parseInt(data.player_id));
    updatePlayerBet(data.player_id, parseInt(data.bet));
    //player.subtotal_bet = data.bet;
    //should validate players account balance, betting amount
    //or we calculate and send options with possible maximum one can bet

    if (highestBet > player.subtotal_bet) {
      console.log('create side pot.');
    } else {
      highestBet = player.subtotal_bet;
      next = getNextPlayer(getIdPlayer(player.player_id));
      sendToPlayer(socketToPlayerMap, next);
    }
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////
function dealCommunityCards() {
  if (gameStage == 'preFlop') {
    //send to all players 3 cards
    //set to flop
    drawCards(1);
    flop = drawCards(3);
    flop.forEach((e) => {
      communityCards.push(e);
    });
    sendToAllPlayers({ cardType: 'flop', card: flop });
    gameStage = 'flop';
  } else if (gameStage == 'flop') {
    //send turn card
    //set to turn
    drawCards(1);
    turn = drawCards(1)[0];
    communityCards.push(turn);
    sendToAllPlayers({ cardType: 'turn', card: turn });
    gameStage = 'turn';
  } else if (gameStage == 'turn') {
    //send river card
    //set to river
    drawCards(1);
    river = drawCards(1)[0];
    communityCards.push(river);
    sendToAllPlayers({ cardType: 'river', card: river });
    gameStage = 'river';
  } else if (gameStage == 'river') {
    //check result
    //set to preFlop, at starGame?
    //handleShowDown();
    //gameStage = 'preFlop';
  }
}

function handleShowDown() {
  //loop through active players:
  //analyze hands of each player, best 5 cards of carda, cardb, plus community cards
  //compare hands
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].status == 'active') {
      //check flush
      cardset = [];
      cardset.push(playerList[i].carda);
      cardset.push(playerList[i].cardb);
      communityCards.forEach((e) => {
        cardset.push(e);
      });

      cardset.sort((a, b) => {
        return a.slice(1) - b.slice(1);
      });
      console.log(cardset);
      //sort cardset from big to small
      playerHand = getAnalyzedHand(cardset);
      playerList[i].hand = playerHand;
    }
  }
  sortedPlayers = sortHandType(playerList);
  console.log(sortedPlayers);
  //sortedPlayers.slice(0, 2);

  winner = getWinner(sortedPlayers[0], sortedPlayers[1]);
  sendToPlayerResult(winner);
}

function sendToPlayerResult(aPlayer) {
  socketToPlayerMap.forEach((value, key, map) => {
    if (value.player_id == aPlayer.player_id) {
      io.to(key).emit('winnerMsg', aPlayer);
    } else {
      io.to(key).emit('losersMsg', value);
    }
  });
}

function sortHandType(pList) {
  pList.sort((a, b) => {
    return b.hand.type - a.hand.type;
  });
  return pList;
}

// function analyzeHand(cards) {
//   flush = checkFlush(cards);
//   if (flush.type == 'FLUSH') {
//     straightFlush = checkStraightFlush(flush.card);
//     if (straightFlush.type == 'STRAIGHT_FLUSH') {
//       //STRIGHT_FLUSH
//       return straightFlush;
//     } else {
//       //FLUSH
//       return { type: 'FLUSH', card: flush.card.slice(0, 5) };
//     }
//   } else {
//     fourOfaKind = check4ofaKind(cards);
//     if (fourOfaKind.type == '4_OF_A_KIND') {
//       //4_OF_A_KIND
//       return fourOfaKind;
//     } else {
//       aSet = checkSet(cards);
//       if (aSet.type == 'SET') {
//         //exclude 3 same cards
//         restCards = getRestCards(aSet.cards, cards);
//         aPair = checkPair(restCards);
//         if (aPair.type == 'PAIR') {
//           //FULLHOUSE
//           aFullHouse = [];
//           aSet.forEach((e) => {
//             aFullHouse.push(e);
//           });
//           aPair.forEach((e) => {
//             aFullHouse.push(e);
//           });
//           return { type: 'FULLHOUSE', card: aFullHouse };
//         } else {
//           //do nothing, if it is no fullhouse
//         }
//       } else {
//         straight = checkStraight(cards);
//         if (straight.type == 'STRAIGHT') {
//           //STRAIGHT
//           return straight;
//         } else if (aSet.type == 'SET') {
//           return { type: 'SET', card: aSet };
//         } else {
//           pair1 = checkPair(cards);
//           if (pair1.type == 'PAIR') {
//             restCards = getRestCards(pair1.cards, cards);
//             pair2 = checkPair(restCards);
//             if (pair2.type == 'PAIR') {
//               //2 PAIR
//               twoPair = [];
//               pair1.forEach((e) => {
//                 twoPair.push(e);
//               });
//               pair2.forEach((e) => {
//                 twoPair.push(e);
//               });
//               return { type: '2PAIR', card: twoPair };
//             } else {
//               // 1 PAIR
//               return { type: 'PAIR', card: pair1 };
//             }
//           } else {
//             // HIGH_CARD
//             return { type: 'HIGH_CARD', card: cards };
//           }
//         }
//       }
//     }
//   }
// }

// function checkPair(cards) {
//   for (var j = 0; j < cards.length - 1; j++) {
//     pairCards = [];
//     for (var i = j + 1; i < cards.length; i++) {
//       pairCards.push(cards[j]);
//       if (cards[j].slice(1) == cards[i].slice(1)) {
//         pairCards.push(cards[i]);
//       }
//     }
//     if (pairCards.length == 3) {
//       return { type: 'PAIR', card: pairCards };
//     }
//   }
//   return { type: 'HIGH_CARD', card: cards };
// }

// function checkStraight(cards) {
//   for (var j = 0; j < cards.length - 4; j++) {
//     stCards = [];
//     for (var i = j; i < j + 4; i++) {
//       if (cards[i + 1].slice(1) == cards[i].slice(1) - 1) {
//         stCards.push(cards[i]);
//       } else {
//         break;
//       }
//     }
//     if (stCards.length == 5) {
//       return { type: 'STRAIGHT', card: stCards };
//     }
//   }
//   return { type: 'HIGH_CARD', card: cards };
// }

// function getRestCards(small, whole) {
//   let diff = whole.filter((x) => !small.includes(x));
//   return diff;
// }
// function checkSet(cards) {
//   for (var j = 0; j < cards.length - 2; j++) {
//     setCards = [];
//     for (var i = j + 1; i < cards.length; i++) {
//       setCards.push(cards[j]);
//       if (cards[j].slice(1) == cards[i].slice(1)) {
//         setCards.push(cards[i]);
//       }
//     }
//     if (setCards.length == 3) {
//       return { type: 'SET', card: setCards };
//     }
//   }
//   return { type: 'HIGH_CARD', card: cards };
// }

// function check4ofaKind(cards) {
//   for (var j = 0; j < cards.length - 3; j++) {
//     fourOfaKindCards = [];
//     fourOfaKindCards.push(cards[j]);
//     for (var i = j + 1; i < cards.length; i++) {
//       if (cards[j].slice(1) == cards[i].slice(1)) {
//         fourOfaKindCards.push(cards[i]);
//       }
//     }
//     if (fourOfaKindCards.length == 4) {
//       return { type: '4_OF_A_KIND', card: fourOfaKindCards };
//     }
//   }
//   return { type: 'HIGH_CARD', card: cards };
// }

// function checkStraightFlush(cards) {
//   //sort cards big to small, first hit possible biggist straightflush
//   for (var j = 0; j < cards.length - 4; j++) {
//     sfCards = [];
//     sfCards.push(cards[j]);
//     for (var i = j + 1; i < j + 5; i++) {
//       if (parseInt(cards[i].slice(1)) == parseInt(cards[i - 1].slice(1)) - 1) {
//         sfCards.push(cards[i]);
//       } else {
//         break;
//       }
//     }
//     if (sfCards.length == 5) {
//       return { type: 'STRAIGHT_FLUSH', card: sfCards };
//     }
//   }
//   return { type: 'FLUSH', card: cards };
// }

// function testJs(cards) {
//   return cards[0].slice(1);
// }

// function checkFlush(cards) {
//   hearts = [];
//   spades = [];
//   diamonds = [];
//   clubs = [];

//   cards.forEach((e) => {
//     suit = e.slice(0, 1);
//     if (suit == 'h') {
//       hearts.push(e);
//     } else if (suit == 's') {
//       spades.push(e);
//     } else if (suit == 'd') {
//       diamonds.push(e);
//     } else if (suit == 'c') {
//       clubs.push(e);
//     }
//   });

//   if (hearts.length >= 5) {
//     return { type: 'FLUSH', card: sortNumber(hearts) };
//   } else if (spades.length >= 5) {
//     return { type: 'FLUSH', card: sortNumber(spades) };
//   } else if (diamonds.length >= 5) {
//     return { type: 'FLUSH', card: sortNumber(diamonds) };
//   } else if (clubs.length >= 5) {
//     return { type: 'FLUSH', card: sortNumber(clubs) };
//   } else {
//     return { type: 'HIGH_CARD', card: cards };
//   }
// }
// module.exports = {
//   testJs,
//   check4ofaKind,
//   checkFlush,
//   checkStraightFlush,
//   analyzeHand,
//   server,
// };
// //module.exports = server;
// function sortNumber(cards) {
//   cards.sort((a, b) => {
//     return b.slice(1) - a.slice(1);
//   });
//   return cards;
// }

//module.exports ={server}
function sendToAllPlayers(cards) {
  socketToPlayerMap.forEach((value, key, map) => {
    if (cards.cardType == 'flop') {
      io.to(key).emit('layFlopCards', cards.card);
    } else if (cards.cardType == 'turn') {
      io.to(key).emit('layTurnCard', cards.card);
    } else if (cards.cardType == 'river') {
      io.to(key).emit('layRiverCard', cards.card);
    } else {
      console.log('do not know what to send.');
    }
  });
}

function sendToPlayer(socket_player, aPlayer) {
  socket_player.forEach((value, key, map) => {
    if (value.player_id == aPlayer.player_id) {
      if (highestBet - aPlayer.subtotal_bet <= aPlayer.bankroll) {
        aPlayer.minToCall = highestBet - aPlayer.subtotal_bet;
      } else {
        aPlayer.minToCall = aPlayer.bankroll;
        //io.to(key).emit('options3', aPlayer); //options3 : fold, all in
      }

      if (aPlayer.subtotal_bet != highestBet) {
        io.to(key).emit('options1', aPlayer); //options1 : fold, raise, call
      } else {
        io.to(key).emit('options2', aPlayer); //options2 : fold, raise, check
      }
      console.log('players info : ' + JSON.stringify(aPlayer));
    }
  });
}
//update a player's info with player_id == id, jTag field with new value jVal
function updatePlayerRole(id, jVal) {
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].player_id == id) {
      playerList[i].role = jVal;
      return;
    }
  }
}

function updatePlayerStatus(id, jVal) {
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].player_id == id) {
      playerList[i].status = jVal;
      return;
    }
  }
}

function updatePlayerSubtotalBet(id, jVal) {
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].player_id == id) {
      playerList[i].subtotal_bet = jVal;
      return;
    }
  }
}

// jVal is the delta to call
function updatePlayerBet(id, jVal) {
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].player_id == id) {
      playerList[i].subtotal_bet = playerList[i].subtotal_bet + jVal;
      playerList[i].total_bet = playerList[i].total_bet + jVal;
      playerList[i].bankroll = playerList[i].bankroll - jVal;
      return;
    }
  }
}

function updatePlayer(id, jTag, jVal) {
  for (var i = 0; i < playerList.length; i++) {
    console.log(
      'can this property name be working??? ' + JSON.stringify(playerList[i])
    );
    if (playerList[i].player_id == id) {
      playerList[i].jTag = jVal;
      console.log(
        'can this property name be working? ' + JSON.stringify(playerList[i])
      );
      return;
    }
  }
}

//get players with jTag == jVal
function getRolePlayers(jVal) {
  var findedPlayers = [];
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].role == jVal) {
      findedPlayers.push(playerList[i]);
    }
  }
  return findedPlayers;
}

function getStatusPlayers(jVal) {
  var findedPlayers = [];
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].status == jVal) {
      findedPlayers.push(playerList[i]);
    }
  }
  return findedPlayers;
}

function getIdPlayer(jVal) {
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].player_id == jVal) {
      return playerList[i];
    }
  }
}

function getPlayers(jTag, jVal) {
  var findedPlayers = [];
  for (var i = 0; i < playerList.length; i++) {
    console.log(
      'can this property name be working!! ' + JSON.stringify(playerList[i])
    );
    if (playerList[i].jTag == jVal) {
      findedPlayers.push(playerList[i]);
    }
  }
  return findedPlayers;
}

function startGame(socket, io) {
  if (playerList.length > 1) {
    //set player to active before settting isGameOn, because there might be waitting players in the list
    for (var i = 0; i < playerList.length; i++) {
      playerList[i].status = 'active';
      playerList[i].subtotal_bet = 0;
    }
    isGameOn = true; //after this, the new joined players will be in inactive
    gameStage = 'preFlop';
    button = getButtonPlayer(); // possible to change to async function
    console.log('button player id is: ' + button.player_id);
    dealHoleCards();
    socketToPlayerMap.forEach((value, key, map) => {
      console.log('send according to key: ' + key);
      io.to(key).emit('faceDownCards', value);
    });
    next = getNextPlayer(big);
    console.log('sending to next player of big blind: ' + JSON.stringify(next));
    //fold card round, from next player of big blind to big blind
    sendToPlayer(socketToPlayerMap, next);
  } else {
    console.log('waiting for other players to start game.');
    socket.emit('message2', 'only one player now.');
  }
}

//this function will send back the hole cards response to client
function dealHoleCards() {
  makeDeck();
  small = getNextPlayer(button);
  updatePlayerRole(small.player_id, 'small');
  updatePlayerBet(small.player_id, 10); //hardcoded small blind 10
  //updatePlayer(small.player_id, '', '');
  updatePlayerHoleCards(small);
  console.log('cards deck length is ' + cards.length);
  console.log('small json: ' + JSON.stringify(small));

  //get big blind but we do not assign the role
  big = getNextPlayer(small);
  //updatePlayer(next.player_id, '', '');
  updatePlayerBet(big.player_id, 20); //hardcoded big blind 20
  updatePlayerHoleCards(big);
  console.log('cards deck length is ' + cards.length);
  console.log('big json: ' + JSON.stringify(big));
  highestBet = 20;
  next = big;
  while (button.player_id != next.player_id) {
    next = getNextPlayer(next);
    //updatePlayer(next.player_id, '', '');
    updatePlayerHoleCards(next);
    console.log('cards deck length is ' + cards.length);
    console.log('next json: ' + JSON.stringify(next));
  }
}

function getButtonPlayer() {
  playerList.sort((a, b) => {
    return a.player_id - b.player_id;
  });
  buttonPlayer = getRolePlayers('button');
  if (buttonPlayer.length == 0) {
    //new game, fresh player list no button assigned, or button just left the game?
    updatePlayerRole(playerList[0].player_id, 'button'); // assign the first available seat pos as button
    return getRolePlayers('button')[0];
  } else {
    updatePlayerRole(buttonPlayer[0].player_id, '');
    next = getNextPlayer(buttonPlayer[0]);
    updatePlayerRole(next.player_id, 'button');
    return next; // move the button to the next possible seat pos
  }
}

function getNextPlayer(player) {
  for (var i = player.player_id; i < playerList.length; i++) {
    //console.log('player id: '  +playerList[i].player_id);
    if (playerList[i].status != 'inactive') {
      return playerList[i];
    }
  }
  for (var i = 0; i < player.player_id - 1; i++) {
    //console.log('player id: '  +playerList[i].player_id);
    if (playerList[i].status != 'inactive') {
      return playerList[i];
    }
  }
}

function drawCards(nrOfCards) {
  outCards = [];
  for (var i = 0; i < nrOfCards; i++) {
    index = getRandomCardIndex();
    outCards.push(cards[index]);
    cards.splice(index, 1);
  }
  return outCards;
}

function updatePlayerHoleCards(player) {
  index = getRandomCardIndex();
  player.carda = cards[index];
  cards.splice(index, 1);

  index = getRandomCardIndex();
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

function Player(
  playerId,
  name,
  role,
  bankroll,
  carda,
  cardb,
  status,
  total_bet,
  subtotal_bet
) {
  this.player_id = playerId; //seating position
  this.name = name;
  this.role = role; // small, big, button
  this.bankroll = bankroll;
  this.carda = carda;
  this.cardb = cardb;
  this.status = status; //active: playing, inactive: seated but not playing(player who folded, new player joined in but game is already on)
  this.total_bet = total_bet;
  this.subtotal_bet = subtotal_bet;
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

//   io.on("connection", function (socket) {
//     console.log("Made socket connection");

//     socket.on("new user", function (data) {
//       socket.userId = data;
//       activeUsers.add(data);
//       io.emit("new user", [...activeUsers]);
//     });

//     socket.on("disconnect", () => {
//       activeUsers.delete(socket.userId);
//       io.emit("user disconnected", socket.userId);
//     });

//     socket.on("chat message", function (data) {
//       io.emit("chat message", data);
//     });

//     socket.on("typing", function (data) {
//       socket.broadcast.emit("typing", data);
//     });
//   });
