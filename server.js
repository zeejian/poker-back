const express = require('express');
const app = express();
const server = require('http').Server(app);
const { Pool } = require('pg');
//const io = require('socket.io')(server);
session = require('express-session')({
  secret: 'my-secret',
  resave: true,
  saveUninitialized: true,
});
sharedsession = require('express-socket.io-session');
global.io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

const cors = require('cors');
//dev env port
//const port = process.env.PORT || 9000;
//production:
const port = process.env.PORT || 8080;

const index = require('./routes/index');
const getAnalyzedHand = require('./js/hand').getAnalyzedHand;
const getRankedPlayers = require('./js/hand').getRankedPlayers;
const distributeChips = require('./js/hand').distributeChips;
const sleep = require('./js/handler').sleep;
const makeDeck = require('./js/handler').makeDeck;
const drawCards = require('./js/handler').drawCards;
const updatePlayerHoleCards = require('./js/handler').updatePlayerHoleCards;
const getNextPlayer = require('./js/handler').getNextPlayer;
const getStartingPlayer = require('./js/handler').getStartingPlayer;
const getButtonPlayer = require('./js/handler').getButtonPlayer;
const updatePlayerBet = require('./js/handler').updatePlayerBet;
const updatePlayerRole = require('./js/handler').updatePlayerRole;
const updatePlayerStatus = require('./js/handler').updatePlayerStatus;
const getRolePlayers = require('./js/handler').getRolePlayers;
const getIdPlayer = require('./js/handler').getIdPlayer;
const getStatusPlayers = require('./js/handler').getStatusPlayers;
const sendToPlayer = require('./js/handler').sendToPlayer;
const sendToAllPlayers = require('./js/handler').sendToAllPlayers;
const handleShowDown = require('./js/handler').handleShowDown;
const showDownAndRestart = require('./js/handler').showDownAndRestart;
const restartGame = require('./js/handler').restartGame;
const updatePlayerHandCards = require('./js/handler').updatePlayerHandCards;
const updatePlayerInfoDB = require('./js/handler').updatePlayerInfoDB;
const startGame = require('./js/handler').startGame;
const deRegisterPlayer = require('./js/handler').deRegisterPlayer;
const removeFromArray = require('./js/handler').removeFromArray;
const collectChips = require('./js/handler').collectChips;
const dealCommunityCards = require('./js/handler').dealCommunityCards;
const fetchPlayerInfo = require('./js/handler').fetchPlayerInfo;
const handleJoinGame = require('./js/handler').handleJoinGame;
const initPlayer = require('./js/handler').initPlayer;
const handleLeftPlayer = require('./js/handler').handleLeftPlayer;
const handleNoShowDown = require('./js/handler').handleNoShowDown;


const { json } = require('body-parser');
//const getNextPlayer = require('./js/handler').getNextPlayer;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'test',
  password: '123',
  port: 5432,
});

app.use(cors());
app.use(index);
// const sessionMiddleware = session({

//   secret: 'some secret',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { maxAge: 60000 },
// });
// register middleware in Express
app.use(session);
// register middleware in Socket.IO
// io.use((socket, next) => {
//   sessionMiddleware(socket.request, {}, next);
//   // sessionMiddleware(socket.request, socket.request.res, next); will not work with websocket-only
//   // connections, as 'socket.request.res' will be undefined in that case
// });

io.use(
  sharedsession(session, {
    autoSave: true,
  })
);

//globals
global.loggedInUsers = [];
global.playerList = [];
global.communityCards = [];
global.cards = new Array(52);
global.socketToPlayerMap = new Map(); //(socket.id, Player)
global.socketToPlayerIdMap = new Map();
global.isGameOn = false;
global.button;
global.small;
global.big;
global.pot = 0;
global.deadBet = 0;
global.highestBet = 0;
global.flop = [];
global.turn = '';
global.river = '';
global.gameStage; //enum: preFlop, flop, turn, river
global.tokenPlayer;
// io.on("connection", (socket) => {
//   console.log("New client connected");
//   if (interval) {
//     clearInterval(interval);
//   }
//   interval = setInterval(() => getApiAndEmit(socket), 1000);
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//     clearInterval(interval);
//   });
// });

// const getApiAndEmit = socket => {
//   const response = new Date();
//   // Emitting a new message. Will be consumed by the client
//   socket.emit("FromAPI", response);
// };

server.listen(port, () => console.log(`Listening on port ${port}`));
//server.listen(65080);

io.on('connection', function (socket) {
  // const session = socket.request.session;
  // session.connections++;
  // session.save();
  console.log('session data', socket.handshake.session.id);
  console.log('session data', JSON.stringify(socket.handshake.session));
  console.log(
    'A client open the window:',
    socket.id,
    ', session is: ' +
      JSON.stringify(socket.request.session) +
      ', id: ' +
      session.id
  );
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
  socket.on('login', function (player_id) {
    console.log('SERVER log in');
    if (loggedInUsers.includes(player_id)) {
      console.log('SERVER log in, already have user');
      socket.emit('updateUserStatus', 'registered');
    } else {
      console.log('SERVER log in, add user');
      loggedInUsers.push(player_id);
      socketToPlayerIdMap.set(socket.id, player_id);
      socket.emit('updateUserStatus', 'new');
    }
  });

  socket.on('logout', function (playerData) {
    if (socketToPlayerMap.has(socket.id)) {
      player = socketToPlayerMap.get(socket.id);
      //if playerList length is 2, deregister the player, restart the game
      deadBet += player.total_bet;
      if (playerList.length <= 2) {
        handleLeftPlayer(player, socket);

        // deRegisterPlayer(player, socket);

        //clearBoard()
      } else {
        if (tokenPlayer.player_id === player.player_id) {
          next = getNextPlayer(player);
          sendToPlayer(socketToPlayerMap, next);
        }
        deRegisterPlayer(player, socket);
      }
      socket.emit('resetSeat', playerData);
    }
    console.log(playerList);
    console.log(socketToPlayerMap);
  });

  socket.on('disconnect', function () {
    console.log('A client close the window:', socket.id);

    if (socketToPlayerMap.has(socket.id)) {
      player = socketToPlayerMap.get(socket.id);
      //if playerList length is 2, deregister the player, restart the game
      deadBet += player.total_bet;
      if (playerList.length <= 2) {
        handleLeftPlayer(player, socket);

        // deRegisterPlayer(player, socket);

        //clearBoard()
      } else {
        //FIX: introduce hasToken to foward the option to next available player when current player close browser --done.
        if (tokenPlayer.player_id === player.player_id) {
          next = getNextPlayer(player);
          sendToPlayer(socketToPlayerMap, next);
        }
        //io.emit('updateDefault', playerList);
        io.emit('updateDisconnectedPlayer', player);
        io.emit('hideAccountInfo', player);
        deRegisterPlayer(player, socket);
      }
    }
    removeFromArray(loggedInUsers, socketToPlayerIdMap.get(socket.id));
    socketToPlayerIdMap.delete(socket.id);
    console.log('There are ' + loggedInUsers.length + ' logged user.');
  });

  //console.log('new player opens a browser window');
  socket.on('joinGameEvent', function (data) {
    console.log('A client sent us this dumb message:', JSON.stringify(data));
    handleJoinGame(data, socket);
  });

  socket.on('playerActionFold', function (data) {
    console.log('received the user action fold event.');
    // if playerList length is less 3, start over; otherwise deregister the player(reset status)

    console.log('player with id: ' + data.player_id + ' folded.');
    player = getIdPlayer(parseInt(data.player_id));
    updatePlayerStatus(player.player_id, 'folded'); // instroduce new state 'folded'

    //updatePlayerSubtotalBet(parseInt(data.player_id), 0);
    nrOfactivePlayers = getStatusPlayers('active').length;
    console.log('nubmer of active player is : ' + nrOfactivePlayers);

    //reset subtotal_bet, hasChecked!

    socket.emit('foldMsg', player.player_id);

    io.emit('removePlayerHighlight', [player]);
    io.emit('foldCards', player);

    if (nrOfactivePlayers < 2) {
      //winner takes the pot
      next = getNextPlayer(player);

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
      updatePlayerInfoDB(player).catch((e) => console.error(e.stack));
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
            //button = getRolePlayers('button')[0];
            sendToPlayer(socketToPlayerMap, getStartingPlayer());
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
          playerToStart = getStartingPlayer();
          //button = getRolePlayers('button')[0];
          sendToPlayer(socketToPlayerMap, playerToStart); //dont send call option
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
            playerToStart = getStartingPlayer();
            //button = getRolePlayers('button')[0];
            sendToPlayer(socketToPlayerMap, playerToStart); //dont send call optio
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
    updatePlayerBet(player.player_id, parseInt(data.bet));
    updatePlayerInfoDB(player).catch((e) => console.error(e.stack));
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
    updatePlayerBet(player.player_id, parseInt(data.bet));
    updatePlayerInfoDB(player).catch((e) => console.error(e.stack));
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



function sortHandByCardType(pList) {
  pList.sort((a, b) => {
    return b.hand.type - a.hand.type;
  });
  return pList;
}

function updatePlayerSubtotalBet(id, jVal) {
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].player_id == id) {
      playerList[i].subtotal_bet = jVal;
      return;
    }
  }
}

function addPlayerBetToPot(player) {
  pot += player.total_bet;
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
