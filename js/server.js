const express = require('express');
const { readFile } = require('fs');
var bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const getAnalyzedHand = require('./hand').getAnalyzedHand;
//const compareHands = require('./hand').compareHands;
//const getWinners = require('./hand').getWinners;
const getRankedPlayers = require('./hand').getRankedPlayers;
const distributeChips = require('./hand').distributeChips;
const rebalanceBankroll = require('./hand').rebalanceBankroll;

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
var deadBet = 0;
var highestBet = 0;
var flop = [];
var turn = '';
var river = '';
var gameStage; //enum: preFlop, flop, turn, river

app.get('/', (request, response) => {
  readFile('./public/play.html', 'utf8', (err, html) => {
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
  if (flop.length == 3) {
    io.to(socket.id).emit('layFlopCards', flop);
  }
  if (turn != '') {
    io.to(socket.id).emit('layTurnCard', turn);
  }
  if (river != '') {
    io.to(socket.id).emit('layRiverCard', river);
  }

  if (playerList.length != 0) {
    playerList.forEach((e) => {
      io.to(socket.id).emit('playerSeated', e);
      io.to(socket.id).emit('updateOtherPlayers', e);
      io.to(socket.id).emit('updatePlayerInfo', e);
      io.to(socket.id).emit('updatePot', pot);
    });
  }

  socket.on('disconnect', function (player) {
    console.log('A client close the window:', socket.id);

    if (socketToPlayerMap.has(socket.id)) {
      player = socketToPlayerMap.get(socket.id);
      //if playerList length is 2, deregister the player, restart the game
      deadBet += player.total_bet;
      if (playerList.length <= 2) {
        deRegisterPlayer(player, socket);
        isGameOn = false;
        gameStage = 'preFlop';
        flop = [];
        turn = '';
        river = '';
        communityCards = [];
        deadBet = 0;
        //clearBoard()
      } else {
        if (player.hasToken) {
          next = getNextPlayer(player);
          sendToPlayer(socketToPlayerMap, next);
        }
        deRegisterPlayer(player, socket);
      }
    }
    console.log(playerList);
    console.log(socketToPlayerMap);
  });

  //console.log('new player opens a browser window');
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
      0,
      0
    );
    playerList.push(onePlayer);
    socketToPlayerMap.set(socket.id, onePlayer);

    // if (flop.length == 3) {
    //   io.to(socket.id).emit('layFlopCards', flop);
    // }
    // if (turn != '') {
    //   io.to(socket.id).emit('layTurnCard', turn);
    // }
    // if (river != '') {
    //   io.to(socket.id).emit('layRiverCard', river);
    // }

    //wait for 1 second, if gameNotOn(if playerList>1, start game, otherwise only wait for other players), else do nothing.
    socket.broadcast.emit('playerSeated', onePlayer);
    socket.emit('updateMainPlayer', onePlayer);
    socket.broadcast.emit('updateOtherPlayers', onePlayer);
    //io.emit('updatePlayerInfo', onePlayer);

    if (!isGameOn) {
      startGame();
    } else {
      console.log('waiting for this round finish.');
    }
  });

  socket.on('playerActionFold', function (data) {
    console.log('received the user action fold event.');
    // if playerList length is less 3, start over; otherwise deregister the player(reset status)

    console.log('player with id: ' + data.player_id + ' folded.');
    updatePlayerStatus(parseInt(data.player_id), 'folded'); // instroduce new state 'folded'

    //updatePlayerSubtotalBet(parseInt(data.player_id), 0);
    nrOfactivePlayers = getStatusPlayers('active').length;
    console.log('nubmer of active player is : ' + nrOfactivePlayers);

    //reset subtotal_bet, hasChecked!

    socket.emit('foldMsg', data.player_id);

    io.emit('removePlayerHighlight', [data]);
    io.emit('foldCards', data);

    if (nrOfactivePlayers < 2) {
      //winner takes the pot
      next = getNextPlayer(data);

      handleNoShowDown(next);
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
      io.emit('updatePlayerInfo', player);
      io.emit('updatePot', pot);
      next = getNextPlayer(player);

      console.log(JSON.stringify(player));
      console.log(JSON.stringify(next));

      //if the next players bet equals to highestBet,
      //we do not want to give the option 'call'?
      //if the next players bet is less than the highestBet, we dont give option 'check'?
      if (next.player_id == player.player_id) {
        socket.broadcast.emit('showFaceDownCards', player);
        while (gameStage != 'river') {
          dealCommunityCards();
        }
        handleShowDown();
      }

      if (next.subtotal_bet == highestBet) {
        if (
          (next.player_id == big.player_id && next.total_bet != 20) ||
          next.player_id != big.player_id
        ) {
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
            handleShowDown(io);
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
    io.emit('updatePlayerInfo', player);
    io.emit('updatePot', pot);
    //player.subtotal_bet = data.bet;
    //should validate players account balance, betting amount
    //or we calculate and send options with possible maximum one can bet
    console.log('create side pot.' + player);
    if (highestBet > player.subtotal_bet) {
      console.log('create side pot.');
    } else {
      highestBet = player.subtotal_bet;
      next = getNextPlayer(getIdPlayer(player.player_id));

      if (player.bankroll == 0) {
        updatePlayerStatus(player.player_id, 'allIn');
        socket.broadcast.emit('showFaceDownCards', player);
      }
      //if next is only active player, send call and fold option
      sendToPlayer(socketToPlayerMap, next);
    }
  });

  socket.on('playerActionAllIn', function (data) {
    console.log(
      'received the user action allIn event, player id :' +
        data.player_id +
        ', allIn bet amount:' +
        data.bet
    );

    player = getIdPlayer(parseInt(data.player_id));
    updatePlayerBet(data.player_id, parseInt(data.bet));
    io.emit('updatePlayerInfo', player);
    io.emit('updatePot', pot);
    socket.broadcast.emit('showFaceDownCards', player);

    next = getNextPlayer(getIdPlayer(player.player_id));
    updatePlayerStatus(player.player_id, 'allIn');
    if (next.player_id == player.player_id || next.subtotal_bet == highestBet) {
      // the next player already raised, it should be the previous player as well
      while (gameStage != 'river') {
        dealCommunityCards();
      }
      handleShowDown(io);
    } else {
      sendToPlayer(socketToPlayerMap, next);
    }
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////
function deRegisterPlayer(player, socket) {
  const index = playerList.indexOf(player);
  if (index > -1) {
    playerList.splice(index, 1);
  }
  socketToPlayerMap.delete(socket.id);
  socket.broadcast.emit('playerLeftGame', player);
}

function collectChips(winner, fPlayers) {
  //deadBet = 0;
  fPlayers.forEach((e) => {
    deadBet += e.total_bet;
  });
  winner.bankroll += deadBet;
}

function addPlayerBetToPot(player) {
  pot += player.total_bet;
}
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
  } else {
    alert('unknown game stage.');
  }
}
async function handleNoShowDown(player) {
  player.bankroll += player.total_bet;
  collectChips(player, getStatusPlayers('folded'));
  io.emit('updatePlayerInfo', player);
  io.emit('updatePot', pot);
 // io.emit('removePlayerHighlight', playerList);

  io.emit('showNoShowDownWinner', player);
  await sleep(2000);
  io.emit('removePlayerHighlight', playerList);
  //wait for seconds to start new round
  console.log('this round ended.');
  isGameOn = false;
  if (!isGameOn) {
    restartGame();
  } else {
    //could it be 'fold' is hit but new game is started by new joined players
    console.log('new players are in.');
  }
}
function handleShowDown() {
  //loop through active players:
  //analyze hands of each player, best 5 cards of carda, cardb, plus community cards
  //compare hands
  activePlayers = [];
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].status == 'active' || playerList[i].status == 'allIn') {
      //check flush
      cardset = [];
      cardset.push(playerList[i].carda);
      cardset.push(playerList[i].cardb);
      communityCards.forEach((e) => {
        cardset.push(e);
      });

      cardset.sort((a, b) => {
        return b.slice(1) - a.slice(1);
      });
      console.log(cardset);
      //sort cardset from big to small
      playerHand = getAnalyzedHand(cardset);
      playerList[i].hand = playerHand;
      activePlayers.push(playerList[i]);
    }
    if (playerList[i].status == 'active') {
      io.emit('showFaceDownCards', playerList[i]);
    }
  }

  io.emit('removePlayerHighlight', playerList);
  //sortedPlayers = sortHandByCardType(playerList);
  //winners = getWinners(sortedPlayers);

  //FIX: for every player, check totolBet is highest totalBet, if less than totalBet, which is a all in case,
  foldedPlayers = getStatusPlayers('folded');
  rankedPlayers = getRankedPlayers(activePlayers);
  distributeChips(rankedPlayers, foldedPlayers);
  showDownAndRestart(activePlayers);
  console.log('got run first?');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function showDownAndRestart(activePlayers) {
  each = deadBet / activePlayers.length; //split the dead chips
  for (let i = 0; i < activePlayers.length; i++) {
    activePlayers[i].chips += each;
    if (activePlayers[i].chips != 0) {
      await sleep(1000);
      io.emit('showResult', activePlayers[i]);
      activePlayers[i].bankroll += activePlayers[i].chips;
      pot -= activePlayers[i].chips;
      activePlayers[i].chips = 0;
      io.emit('updatePlayerInfo', activePlayers[i]);
      io.emit('updatePot', pot);
      await sleep(3000);
      io.emit('removeCardHighLight', activePlayers[i]);
      io.emit('removePlayerHighlight', [activePlayers[i]]);
      await sleep(1000);
    }
  }

  console.log(rankedPlayers);
  restartGame();
}

async function restartGame() {
  io.emit('updateDefault', playerList); // clear board
  await sleep(1000);
  startGame();
}

function sortHandByCardType(pList) {
  pList.sort((a, b) => {
    return b.hand.type - a.hand.type;
  });
  return pList;
}

//module.exports ={server}
function sendToAllPlayers(cards) {
  if (cards.cardType == 'flop') {
    io.emit('layFlopCards', cards.card);
  } else if (cards.cardType == 'turn') {
    io.emit('layTurnCard', cards.card);
  } else if (cards.cardType == 'river') {
    io.emit('layRiverCard', cards.card);
  } else {
    console.log('do not know what to send.');
  }
}

function sendToPlayer(socket_player, aPlayer) {
  socket_player.forEach((value, key, map) => {
    if (value.player_id == aPlayer.player_id) {
      if (highestBet - aPlayer.subtotal_bet <= aPlayer.bankroll) {
        aPlayer.minToCall = highestBet - aPlayer.subtotal_bet;
      } else {
        aPlayer.minToCall = aPlayer.bankroll;
      }

      if (aPlayer.subtotal_bet != highestBet) {
        if (aPlayer.minToCall == aPlayer.bankroll) {
          io.to(key).emit('options3', aPlayer); //options3 : fold, all in
        } else {
          if (getStatusPlayers('active').length == 1) {
            //option4 : fold, call
            io.to(key).emit('options4', aPlayer);
          } else {
            io.to(key).emit('options1', aPlayer); //options1 : fold, raise, call
          }
        }
      } else {
        io.to(key).emit('options2', aPlayer); //options2 : fold, raise, check
      }
      io.emit('highLightPlayer', { player: aPlayer, allPlayers: playerList });
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
  //update pot
  pot += jVal;

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

async function startGame() {
  if (playerList.length > 1) {
    //set player to active before settting isGameOn, because there might be waitting players in the list
    for (var i = 0; i < playerList.length; i++) {
      playerList[i].status = 'active';
      playerList[i].subtotal_bet = 0;
      playerList[i].total_bet = 0;
      playerList[i].chips = 0;
      playerList[i].hasChecked = false;

      //reset totalBet to 0?
    }
    isGameOn = true; //after this, the new joined players will be in inactive
    gameStage = 'preFlop';
    flop = [];
    turn = '';
    river = '';
    communityCards = [];
    deadBet = 0;
    pot = 0;

    //io.emit('updateDefault', playerList); // clear board
    //await sleep(1000);

    button = getButtonPlayer(); // possible to change to async function
    console.log('button player id is: ' + button.player_id);
    io.emit('updateButton', button);
    updatePlayerHandCards();
    await sleep(1000);
    for (var i = 0; i < 2; i++) {
      var p = button;
      while (getNextPlayer(p).player_id != button.player_id) {
        p = getNextPlayer(p);
        socketToPlayerMap.forEach((value, key, map) => {
          if (value.player_id == p.player_id) {
            io.to(key).emit('faceUpCard' + i, {
              player: p,
            });
          } else {
            io.to(key).emit('faceDownCard' + i, {
              player: p,
            });
          }
        });
        await sleep(1000);
      }

      socketToPlayerMap.forEach((value, key, map) => {
        if (value.player_id == button.player_id) {
          io.to(key).emit('faceUpCard' + i, {
            player: button,
          });
        } else {
          io.to(key).emit('faceDownCard' + i, {
            player: button,
            //   other: playerList,
          });
        }
      });
      await sleep(1000);
    }

    next = getNextPlayer(big);
    console.log('sending to next player of big blind: ' + JSON.stringify(next));
    //fold card round, from next player of big blind to big blind
    sendToPlayer(socketToPlayerMap, next);
  } else {
    console.log('waiting for other players to start game.');
    //socket.emit('message2', 'only one player now.');
  }
}

async function dealFaceDownCards(io, button) {
  for (var i = 0; i < 2; i++) {
    var p = button;
    while (getNextPlayer(p).player_id != button.player_id) {
      p = getNextPlayer(p);
      io.emit('faceDownCard' + i, { player: p, other: playerList });
      await sleep(5000);
      io.emit('faceDownCards' + i, { player: p, other: playerList });
      await sleep(5000);
    }
    io.emit('faceDownCard' + i, { player: button, other: playerList });
    await sleep(5000);
    io.emit('faceDownCard' + i, { player: button, other: playerList });
    await sleep(5000);
  }
}

//this function will send back the hole cards response to client
function updatePlayerHandCards() {
  makeDeck();
  small = getNextPlayer(button);
  updatePlayerRole(small.player_id, 'small');
  updatePlayerBet(small.player_id, 10); //hardcoded small blind 10
  io.emit('updatePlayerInfo', small);
  io.emit('updatePot', pot);
  io.emit('updateSmallBlind', small);
  //updatePlayer(small.player_id, '', '');
  updatePlayerHoleCards(small);
  console.log('cards deck length is ' + cards.length);
  console.log('small json: ' + JSON.stringify(small));

  //get big blind but we do not assign the role
  big = getNextPlayer(small);
  //updatePlayer(next.player_id, '', '');
  updatePlayerBet(big.player_id, 20); //hardcoded big blind 20
  io.emit('updatePlayerInfo', big);
  io.emit('updatePot', pot);
  io.emit('updateBigBlind', big);

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
    if (playerList[i].status == 'active') {
      return playerList[i];
    }
  }
  for (var i = 0; i < player.player_id; i++) {
    //console.log('player id: '  +playerList[i].player_id);
    if (playerList[i].status == 'active') {
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
  subtotal_bet,
  chips
) {
  this.player_id = playerId; //seating position
  this.name = name;
  this.role = role; // small, big, button
  this.bankroll = bankroll;
  this.carda = carda;
  this.cardb = cardb;
  this.status = status; //active: playing, inactive: seated but not playing(player who folded, new player joined in but game is already on)
  this.total_bet = total_bet; //total bet each game
  this.subtotal_bet = subtotal_bet; //bet each round
  this.chips = chips; //winning chips to collect
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
