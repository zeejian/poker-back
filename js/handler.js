const { Pool } = require('pg');
const getRankedPlayers = require('./hand').getRankedPlayers;
const getAnalyzedHand = require('./hand').getAnalyzedHand;
const distributeChips = require('./hand').distributeChips;
const Player = require('./player').Player;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'test',
  password: '123',
  port: 5432,
});


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
//find the next player according to the seat postition, can return the player
function getNextPlayer(player) {
  for (let i = parseInt(player.pos_id) + 1; i < 8; i++) {
    for (let j = 0; j < playerList.length; j++) {
      if (
        parseInt(playerList[j].pos_id) === i &&
        playerList[j].status == 'active'
      ) {
        return playerList[j];
      }
    }
  }
  for (let i = 1; i < parseInt(player.pos_id) + 1; i++) {
    for (let j = 0; j < playerList.length; j++) {
      if (
        parseInt(playerList[j].pos_id) === i &&
        playerList[j].status == 'active'
      ) {
        return playerList[j];
      }
    }
  }
}

function getStartingPlayer() {
  if (playerList.includes(small)) {
    return small;
  } else {
    return getNextPlayer(small);
  }
  // for (var i = 0; i < playerList.length; i++) {
  //   if (playerList[i].pos_id == small.pos_id) {
  //     return playerList[i];
  //   }
  // }
  // return getNextPlayer(small);
}

function getButtonPlayer() {
  playerList.sort((a, b) => {
    return a.pos_id - b.pos_id;
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

function sendToPlayer(socket_player, aPlayer) {
  tokenPlayer = aPlayer
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

//this function will send back the hole cards response to client
function updatePlayerHandCards() {
  makeDeck();
  small = getNextPlayer(button);
  updatePlayerRole(small.player_id, 'small');
  updatePlayerBet(small.player_id, 10); //hardcoded small blind 10
  updatePlayerInfoDB(small).catch((e) => console.error(e.stack));
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
  updatePlayerInfoDB(big).catch((e) => console.error(e.stack));
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

function deRegisterPlayer(player, socket) {
  const index = playerList.indexOf(player);
  if (index > -1) {
    playerList.splice(index, 1);
  }
  socketToPlayerMap.delete(socket.id);
  socket.broadcast.emit('playerLeftGame', player);
  socket.emit('playerLeftGame', player);
  socket.emit('hideMainPlayerAccount', player);
  console.log(playerList);
  console.log(socketToPlayerMap);
}

function removeFromArray(arr, e) {
  const index = arr.indexOf(e);
  console.log('index is :' + index);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

function collectChips(winner, fPlayers) {
  //deadBet = 0;
  fPlayers.forEach((e) => {
    deadBet += e.total_bet;
  });
  winner.bankroll += deadBet;
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
      let playerHand = getAnalyzedHand(cardset);
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
      updatePlayerInfoDB(activePlayers[i]).catch((e) => console.error(e.stack));
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

async function updatePlayerInfoDB(player) {
  const client = await pool.connect();
  try {
    const queryText =
      'UPDATE players SET bankroll=' +
      player.bankroll +
      ' WHERE id=' +
      player.player_id;
    const { rows } = await client.query(queryText);
    console.log('db outputs:' + JSON.stringify(rows[0]));
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
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
      while (getNextPlayer(p).pos_id != button.pos_id) {
        p = getNextPlayer(p);
        socketToPlayerMap.forEach((value, key, map) => {
          if (value.pos_id == p.pos_id) {
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
        if (value.pos_id == button.pos_id) {
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

async function fetchPlayerInfo(data, socket) {
  console.log('input data:' + JSON.stringify(data));
  //FIX:
  // fetch data from DB, and compare.
  //if first time user, insert
  //otherwise update 'player' with bankroll from ---done.

  let onePlayer = new Player(
    //parseInt(data.player_id),
    data.player_id === '' ? parseInt(data.pos_id) : parseInt(data.player_id),
    data.pos_id,
    data.player_name,
    data.player_icon,
    '',
    500,
    '',
    '',
    'inactive',
    0,
    0,
    0
  );

  if (data.player_id !== '') {
    // if not quick start player
    onePlayer = await initPlayer(data).catch((e) => console.error(e.stack));
  }
  //FIX: check duplicates!
  playerList.forEach((p) => {
    console.log(
      'PLAYER LIST element player_id: ' +
        p.player_id +
        ' , new player_id' +
        onePlayer.player_id
    );
    if (p.player_id === onePlayer.player_id) {
      //FIX:set everything unclickable
      throw 'This user is already logged in! Check again!';
    }
  });
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

  //FIX: check Map for the same player
  //wait for 1 second, if gameNotOn(if playerList>1, start game, otherwise only wait for other players), else do nothing.
  socket.broadcast.emit('playerSeated', onePlayer);
  socket.emit('updateMainPlayer', onePlayer);
  socket.broadcast.emit('updateOtherPlayers', onePlayer);
  //io.emit('updatePlayerInfo', onePlayer);
}
async function handleJoinGame(data, socket) {
  try {
    await fetchPlayerInfo(data, socket);
  } catch (error) {
    console.warn(error);
    socket.emit('resetSeat', { pId: data.pos_id, pos: 1 });
  }

  if (!isGameOn) {
    startGame();
  } else {
    console.log('waiting for this round finish.');
  }
}
async function initPlayer(pData) {
  const client = await pool.connect();
  try {
    const queryText =
      'SELECT * FROM players WHERE id=' + parseInt(pData.player_id);
    const { rows } = await client.query(queryText);
    console.log('db outputs:' + JSON.stringify(rows[0]));
    if (rows.length == 0) {
      //insert
      await client.query(
        'INSERT INTO players(id, name, bankroll) VALUES(' +
          parseInt(pData.player_id) +
          ",'" +
          pData.player_name +
          "'," +
          5000 +
          ')'
      );
      await client.query('COMMIT');
      return new Player(
        parseInt(pData.player_id),
        pData.pos_id,
        pData.player_name,
        pData.player_icon,
        '',
        5000,
        '',
        '',
        'inactive',
        0,
        0,
        0
      );
    } else {
      console.log(rows[0].bankroll + ' ' + rows[0].name + ' ' + rows[0].id);
      return new Player(
        rows[0].id,
        pData.pos_id,
        rows[0].name,
        pData.player_icon,
        '',
        rows[0].bankroll,
        '',
        '',
        'inactive',
        0,
        0,
        0
      );
    }
    //await client.query(insertPhotoText, insertPhotoValues)
    //await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function handleLeftPlayer(player, socket) {
  winner = getNextPlayer(player);
  if (!winner) {
    console.log('here?');
    io.emit('hideAccountInfo', player);
    deRegisterPlayer(player, socket);
  } else {
    winner.bankroll += pot;
    console.log(
      'deadBet is ' + deadBet + ',winner bankroll is ' + winner.bankroll
    );
    updatePlayerInfoDB(winner).catch((e) => console.error(e.stack));
    io.emit('updatePlayerInfo', winner);
    io.emit('updatePot', 0);
    // io.emit('removePlayerHighlight', playerList);

    //await sleep(10000);
    io.emit('removePlayerHighlight', playerList);
    io.emit('showNoShowDownWinner', winner);
    await sleep(5000);
    io.emit('updateDefault', playerList);
    io.emit('hidePlayerOption');
    io.emit('hideAccountInfo', player);
    io.emit('removePlayerHighlight', winner);
    await sleep(5000);
    //wait for seconds to start new round
    deRegisterPlayer(player, socket);
  }

  console.log('this round ended.');

  isGameOn = false;
  gameStage = 'preFlop';
  flop = [];
  turn = '';
  river = '';
  communityCards = [];
  deadBet = 0;
  pot = 0;
}

async function handleNoShowDown(player) {
  player.bankroll += player.total_bet;
  collectChips(player, getStatusPlayers('folded'));
  updatePlayerInfoDB(player).catch((e) => console.error(e.stack));
  io.emit('updatePlayerInfo', player);
  io.emit('updatePot', pot);
  // io.emit('removePlayerHighlight', playerList);

  io.emit('showNoShowDownWinner', player);
  await sleep(10000);
  io.emit('removePlayerHighlight', playerList);
  await sleep(10000);
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



module.exports = {
  sleep,
  makeDeck,
  getRandomCardIndex,
  updatePlayerHoleCards,
  drawCards,
  getNextPlayer,
  getStartingPlayer,
  getButtonPlayer,
  updatePlayerBet,
  updatePlayerRole,
  updatePlayerStatus,
  getIdPlayer,
  getRolePlayers,
  getStatusPlayers,
  sendToPlayer,
  sendToAllPlayers,
  deRegisterPlayer,
  removeFromArray,
  collectChips,
  dealCommunityCards,
  handleShowDown,
  showDownAndRestart,
  restartGame,
  updatePlayerHandCards,
  updatePlayerInfoDB,
  startGame,
  fetchPlayerInfo,
  handleJoinGame,
  initPlayer,
  handleLeftPlayer,
  handleNoShowDown,
};
