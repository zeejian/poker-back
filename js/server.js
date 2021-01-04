const express = require("express");
const { readFile } = require("fs");
var bodyParser = require("body-parser");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//globals
var playerList = [];
var cards = new Array(52);
var socketToPlayerMap = new Map(); //(socket.id, Player)
var isGameOn = false;
var button;
var small;
var big;
var pot = 0;
var highestBet = 0;
var gameStage; //enum: preFlop, flop, turn, river

app.get("/", (request, response) => {
  readFile("./public/home.html", "utf8", (err, html) => {
    if (err) {
      response.status(500).send("sorry, out of order");
    }
    response.send(html);
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log("App available on http://localhost:3000")
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

io.on("connection", function (socket) {
  socket.on("joinGameEvent", function (data) {
    console.log("A client sent us this dumb message:", data.player_id);

    onePlayer = new Player(
      parseInt(data.player_id),
      "",
      "",
      100,
      "",
      "",
      "inactive",
      0,
      0
    );
    playerList.push(onePlayer);
    socketToPlayerMap.set(socket.id, onePlayer);

    //wait for 1 second, if gameNotOn(if playerList>1, start game, otherwise only wait for other players), else do nothing.
    if (!isGameOn) {
      startGame(socket, io);
    } else {
      console.log("waiting for this round finish.");
    }
  });

  socket.on("playerActionFold", function (data) {
    console.log("received the user action fold event.");
    // if playerList length is less 3, start over; otherwise deregister the player(reset status)

    console.log("player with id: " + data.player_id + " folded.");
    updatePlayerStatus(parseInt(data.player_id), "inactive");
    updatePlayerSubtotalBet(parseInt(data.player_id), 0);
    nrOfactivePlayers = getStatusPlayers("active").length;
    console.log("nubmer of active player is : " + nrOfactivePlayers);

    //reset subtotal_bet, hasChecked!

    socket.emit("foldMsg", data.player_id);
    //fold the card as well?

    if (nrOfactivePlayers < 2) {
      console.log("this round ended.");
      isGameOn = false;
      if (!isGameOn) {
        startGame(socket, io);
      } else {
        //could it be 'fold' is hit but new game is started by new joined players
        console.log("new players are in.");
      }
    } else {
      // prompt next player
      console.log("this round continues.");
      next = getNextPlayer(getIdPlayer(parseInt(data.player_id)));
      sendToPlayer(socketToPlayerMap, next);
    }
  });

  socket.on("playerActionCall", function (data) {
    console.log("received the user action call event.");
    //calculate delta to call
    player = getIdPlayer(parseInt(data.player_id));

    if (highestBet > player.subtotal_bet) {
      updatePlayerBet(player.player_id, highestBet - player.subtotal_bet);
      next = getNextPlayer(player);
      //if the next players bet equals to highestBet,
      //we do not want to give the option 'call'?
      //if the next players bet is less than the highestBet, we dont give option 'check'?
      if (next.subtotal_bet == highestBet && next.player_id != big.player_id) {
        console.log("this is where we start dealing the next card(s)");
        dealCommunityCards();
        //reset highestBet and subtotal_bet to 0?
        for (var i = 0; i < playerList.length; i++) {
          if (playerList[i].status == "active") {
            playerList[i].subtotal_bet = 0;
          }
        }
        highestBet = 0;

        //send options to the next player of button
        button = getRolePlayers("button")[0];
        sendToPlayer(socketToPlayerMap, getNextPlayer(button));
      } else {
        sendToPlayer(socketToPlayerMap, next);
      }
    } else {
      socket.emit("callMsg", data.player_id);
      console.log(
        "this shouldnt happen that users: " +
          player.player_id +
          " bet is larger than highestBet."
      );
    }
  });

  socket.on("playerActionCheck", function (data) {
    console.log("received the user action check event.");

    player = getIdPlayer(parseInt(data.player_id));
    if (highestBet == player.subtotal_bet) {
      if (player.subtotal_bet != 0) {
        // big blind to start the flop
        dealCommunityCards();
        //reset highestBet and subtotal_bet to 0?
        for (var i = 0; i < playerList.length; i++) {
          if (playerList[i].status == "active") {
            playerList[i].subtotal_bet = 0;
          }
        }
        highestBet = 0;

        //send options to the next player of button
        button = getRolePlayers("button")[0];
        sendToPlayer(socketToPlayerMap, getNextPlayer(button));
      } else {
        //check done from small to button
        // new flag checked?
        if (getNextPlayer(player).hasChecked) {
          //deal
          dealCommunityCards();
          //reset hasChecked flag
          for (var i = 0; i < playerList.length; i++) {
            if (playerList[i].status == "active") {
              playerList[i].hasChecked = false;
            }
          }
          button = getRolePlayers("button")[0];
          sendToPlayer(socketToPlayerMap, getNextPlayer(button));
        } else {
          next = getNextPlayer(player);
          sendToPlayer(socketToPlayerMap, next);
          player.hasChecked = true;
        }
      }
    } else {
      socket.emit("checkMsg", data.player_id);
      console.log("you can not use option check.");
    }
  });
  //incoming data should contain player_id, betting amount
  socket.on("playerActionRaise", function (data) {
    console.log("received the user action raise event.");
    socket.emit("raiseMsg", data.player_id);

    player = getIdPlayer(parseInt(data.player_id));
    player.subtotal_bet = data.bet;
    //should validate players account balance, betting amount
    //or we calculate and send options with possible maximum one can bet

    if (highestBet > player.subtotal_bet) {
      console.log("create side pot.");
    } else {
      highestBet = player.subtotal_bet;
      next = getNextPlayer(getIdPlayer(player.player_id));
      sendToPlayer(socketToPlayerMap, next);
    }
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////
function dealCommunityCards() {
  if (gameStage == "preFlop") {
    //send to all players 3 cards
    //set to flop
    drawCards(1);
    sendToAllPlayers({ cardType: "flop", card: drawCards(3) });
    gameStage = "flop";
  } else if (gameStage == "flop") {
    //send turn card
    //set to turn
    drawCards(1);
    sendToAllPlayers({ cardType: "turn", card: drawCards(1)[0] });
    gameStage = "turn";
  } else if (gameStage == "turn") {
    //send river card
    //set to river
    drawCards(1);
    sendToAllPlayers({ cardType: "river", card: drawCards(1)[0] });
    gameStage = "river";
  } else if (gameStage == "river") {
    //check result
    //set to preFlop, at starGame?
    checkWinner();
    gameStage = "preFlop";
  }
}

function checkWinnter() {}

function sendToAllPlayers(cards) {
  socketToPlayerMap.forEach((value, key, map) => {
    if (cards.cardType == "flop") {
      io.to(key).emit("layFlopCards", cards.card);
    } else if (cards.cardType == "turn") {
      io.to(key).emit("layTurnCard", cards.card);
    } else if (cards.cardType == "river") {
      io.to(key).emit("layRiverCard", cards.card);
    } else {
      console.log("do not know what to send.");
    }
  });
}

function sendToPlayer(socket_player, aPlayer) {
  socket_player.forEach((value, key, map) => {
    if (value.player_id == aPlayer.player_id) {
      console.log("players info : " + JSON.stringify(aPlayer));
      io.to(key).emit("options", aPlayer.player_id); //callback when the loop finishes
    }
  });

  // player_json = JSON.stringify(aPlayer);
  // socket_player.forEach((value, key, map) =>{
  //     if(JSON.stringify(value) == player_json){
  //         io.to(key).emit('options', aPlayer.player_id); //callback when the loop finishes
  //     }
  // })
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
      "can this property name be working??? " + JSON.stringify(playerList[i])
    );
    if (playerList[i].player_id == id) {
      playerList[i].jTag = jVal;
      console.log(
        "can this property name be working? " + JSON.stringify(playerList[i])
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
      "can this property name be working!! " + JSON.stringify(playerList[i])
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
      playerList[i].status = "active";
      playerList[i].subtotal_bet = 0;
    }
    isGameOn = true; //after this, the new joined players will be in inactive
    gameStage = "preFlop";
    button = getButtonPlayer(); // possible to change to async function
    console.log("button player id is: " + button.player_id);
    dealHoleCards();
    socketToPlayerMap.forEach((value, key, map) => {
      console.log("send according to key: " + key);
      io.to(key).emit("faceDownCards", value);
    });
    next = getNextPlayer(big);
    console.log("sending to next player of big blind: " + JSON.stringify(next));
    //fold card round, from next player of big blind to big blind
    sendToPlayer(socketToPlayerMap, next);
  } else {
    console.log("waiting for other players to start game.");
    socket.emit("message2", "only one player now.");
  }
}

//this function will send back the hole cards response to client
function dealHoleCards() {
  makeDeck();
  small = getNextPlayer(button);
  updatePlayerRole(small.player_id, "small");
  updatePlayerBet(small.player_id, 10); //hardcoded small blind 10
  //updatePlayer(small.player_id, '', '');
  updatePlayerHoleCards(small);
  console.log("cards deck length is " + cards.length);
  console.log("small json: " + JSON.stringify(small));

  //get big blind but we do not assign the role
  big = getNextPlayer(small);
  //updatePlayer(next.player_id, '', '');
  updatePlayerBet(big.player_id, 20); //hardcoded big blind 20
  updatePlayerHoleCards(big);
  console.log("cards deck length is " + cards.length);
  console.log("big json: " + JSON.stringify(big));
  highestBet = 20;
  next = big;
  while (button.player_id != next.player_id) {
    next = getNextPlayer(next);
    //updatePlayer(next.player_id, '', '');
    updatePlayerHoleCards(next);
    console.log("cards deck length is " + cards.length);
    console.log("next json: " + JSON.stringify(next));
  }
}

function getButtonPlayer() {
  playerList.sort((a, b) => {
    return a.player_id - b.player_id;
  });
  buttonPlayer = getRolePlayers("button");
  if (buttonPlayer.length == 0) {
    //new game, fresh player list no button assigned, or button just left the game?
    updatePlayerRole(playerList[0].player_id, "button"); // assign the first available seat pos as button
    return getRolePlayers("button")[0];
  } else {
    updatePlayerRole(buttonPlayer[0].player_id, "");
    next = getNextPlayer(buttonPlayer[0]);
    updatePlayerRole(next.player_id, "button");
    return next; // move the button to the next possible seat pos
  }
}

function getNextPlayer(player) {
  for (var i = player.player_id; i < playerList.length; i++) {
    //console.log('player id: '  +playerList[i].player_id);
    if (playerList[i].status != "inactive") {
      return playerList[i];
    }
  }
  for (var i = 0; i < player.player_id - 1; i++) {
    //console.log('player id: '  +playerList[i].player_id);
    if (playerList[i].status != "inactive") {
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
    cards[j++] = "h" + i;
    cards[j++] = "d" + i;
    cards[j++] = "c" + i;
    cards[j++] = "s" + i;
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
