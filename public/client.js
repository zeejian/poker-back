console.log('Client-side code running');

//////////////////////////////////////////////////////
/////   Send request using 'socket.io'    ///////////
//////////////////////////////////////////////////////
var socket = io.connect('/');

// window.onbeforeunload = function(e) {
//   socket.emit('disconnect', 'test');
// };

socket.on('playerLeftGame', function (player) {
  console.log('player: ' + player.player_id + ' has left the game.');
  //update 'player' DOM state
});

socket.on('playerSeated', function (player) {
  console.log('player: ' + player.player_id + ' has joined.');
  //update 'player' DOM state
  const seatButton = document.getElementsByName('seat');
  seatButton.forEach(function (eachButton) {
    if (eachButton.value == player.player_id) {
      eachButton.src = 'images/user.png.png';
      eachButton.disabled = true;
    }
  });
});

socket.on('all', function (player) {
  console.log('received broadcasted msg:' + player.player_id);
});

socket.on('updateMainPlayer', function (player) {
  console.log('update player own info');
  document.getElementById('account' + player.player_id).style.display = '';
  document.getElementById('accountBalance' + player.player_id).innerHTML =
    player.bankroll;
});

socket.on('updateOtherPlayers', function (player) {
  console.log('update other player  info');
  document.getElementById('info' + player.player_id).hidden = '';
  document.getElementById('bankroll' + player.player_id).innerHTML =
    player.bankroll;
});

socket.on('updatePlayerInfo', function (player) {
  console.log('player id is ' + player.player_id);
  console.log('bankroll is ' + player.bankroll);
  if (
    document.getElementById('account' + player.player_id).style.display == ''
  ) {
    document.getElementById('accountBalance' + player.player_id).innerHTML =
      player.bankroll;
  }
  if (document.getElementById('info' + player.player_id).hidden == '') {
    document.getElementById('bankroll' + player.player_id).innerHTML =
      player.bankroll;
  }
})
socket.on('updateButton', function (player) {
  if (player.role == 'button') {
    const button = document.getElementById('button' + player.player_id);
    button.style.display = '';
  } else {
    document.getElementById('button' + player.player_id).style.display = 'none';
  }
});

socket.on('layFlopCards', function (cards) {
  console.log('flop cards are: ' + cards);
  for (var i = 0; i < cards.length; i++) {
    document.getElementById('imgFlopCard' + i).hidden = '';
    document.getElementById('imgFlopCard' + i).src = internal_GetCardImageUrl(
      cards[i]
    );
    document.getElementById('imgFlopCard' + i).width = 50;
    document.getElementById('imgFlopCard' + i).height = 65;
  }
});

socket.on('layTurnCard', function (cards) {
  console.log('turn card is: ' + cards);
  document.getElementById('imgTurnCard').hidden = '';
  document.getElementById('imgTurnCard').src = internal_GetCardImageUrl(cards);
  document.getElementById('imgTurnCard').width = 50;
  document.getElementById('imgTurnCard').height = 65;
});

socket.on('layRiverCard', function (cards) {
  console.log('river card is: ' + cards);
  document.getElementById('imgRiverCard').hidden = '';
  document.getElementById('imgRiverCard').src = internal_GetCardImageUrl(cards);
  document.getElementById('imgRiverCard').width = 50;
  document.getElementById('imgRiverCard').height = 65;
});

socket.on('options1', function (player) {
  id = player.player_id;
  console.log('the client receives player id: ' + id);
  document.getElementById('fold' + id).hidden = '';
  document.getElementById('call' + id).hidden = '';
  document.getElementById('raise' + id).hidden = '';
  if (player.bankroll > player.minToCall) {
    document.getElementById('myRange' + id).max = player.bankroll;
    document.getElementById('myRange' + id).min = player.minToCall;
    document.getElementById('myRange' + id).value = document.getElementById(
      'myRange' + id
    ).min;
  } else {
    //use 'all in' button instead of 'raise', displayed options are 'fold', 'all in'
  }
});

socket.on('options2', function (player) {
  id = player.player_id;
  console.log('the client receives player id: ' + id);
  document.getElementById('fold' + id).hidden = '';
  document.getElementById('check' + id).hidden = '';
  document.getElementById('raise' + id).hidden = '';
  if (player.bankroll > player.minToCall) {
    document.getElementById('myRange' + id).max = player.bankroll;
    document.getElementById('myRange' + id).min = player.minToCall;
    document.getElementById('myRange' + id).value = document.getElementById(
      'myRange' + id
    ).min;
  } //else show 'allIn' button
});

socket.on('options3', function (player) {
  id = player.player_id;
  console.log('the client receives player id: ' + id);
  document.getElementById('fold' + id).hidden = '';
  document.getElementById('allIn' + id).hidden = '';
  document.getElementById('allIn' + id).value = player.minToCall;
});

socket.on('playerOwnWinMsg', function (player) {
  id = player.player_id;
  console.log(
    'the client receives playerOwnWinMsg event, with player id: ' + id
  );

  document.getElementById('ownMsg' + id).hidden = '';
  document.getElementById('ownMsg' + id).innerHTML =
    'Congratulations! YOU WIN!';
  //highlight the winning card
});

socket.on('playerOwnLoseMsg', function (player) {
  id = player.player_id;
  console.log(
    'the client receives playerOwnLoseMsg event, with player id: ' + id
  );

  document.getElementById('ownMsg' + id).hidden = '';
  document.getElementById('ownMsg' + id).innerHTML = 'YOU LOSE!';
  //highlight the winning card
});

socket.on('generalWinMsg', function (players) {
  playerId = players.player.player_id;
  winnerId = players.winner.player_id;
  console.log(
    'the client receives generalWinMsg event, with player id: ' +
      playerId +
      ', winner ID is: ' +
      winnerId
  );

  document.getElementById('ownMsg' + winnerId).hidden = '';
  document.getElementById('ownMsg' + winnerId).innerHTML =
    "Player with ID '" + winnerId + "' wins";
});

socket.on('generalLoseMsg', function (players) {
  playerId = players.player.player_id;
  winnerId = players.winner.player_id;
  console.log(
    'the client receives generalLoseMsg event, with player id: ' +
      playerId +
      ', loser ID is: ' +
      winnerId
  );

  document.getElementById('ownMsg' + winnerId).hidden = '';
  document.getElementById('ownMsg' + winnerId).innerHTML =
    "Player with ID '" + winnerId + "' loses";
});

// const joinSeatButton = document.getElementsByName('seat');
// joinSeatButton.forEach(function (eachButton) {
//   eachButton.addEventListener('click', function (e) {
//     console.log('button was clicked');

//     socket.emit('joinGameEvent', { player_id: eachButton.value });
//     socket.on('faceDownCards', function (player) {
//       console.log('the client receives player list: ' + player);
//       console.log('the client receives player carda: ' + player.carda);
//       document.getElementById(
//         'img' + player.player_id + 'a'
//       ).src = internal_GetCardImageUrl(player.carda);
//       document.getElementById('img' + player.player_id + 'a').width = 100;
//       document.getElementById('img' + player.player_id + 'a').height = 140;
//       document.getElementById(
//         'img' + player.player_id + 'b'
//       ).src = internal_GetCardImageUrl(player.cardb);
//       document.getElementById('img' + player.player_id + 'b').width = 100;
//       document.getElementById('img' + player.player_id + 'b').height = 140;
//       document.getElementById('imgFlopCard0').hidden = 'hidden';
//       document.getElementById('imgFlopCard1').hidden = 'hidden';
//       document.getElementById('imgFlopCard2').hidden = 'hidden';
//       document.getElementById('imgTurnCard').hidden = 'hidden';
//       document.getElementById('imgRiverCard').hidden = 'hidden';
//     });

//     // socket.on('layCards', function (cards) {
//     //   console.log('community cards are: '+ cards);
//     // })
//     socket.on('message2', function (msg) {
//       console.log('the client receives player msg: ' + msg);
//     });
//     // socket.on('options', function (id) {
//     //   console.log('the client receives player id: ' + id);
//     //   document.getElementById('fold'+id).hidden = "";
//     //   document.getElementById('check'+id).hidden = "";
//     //   document.getElementById('raise'+id).hidden = "";
//     //   document.getElementById('call'+id).hidden = "";
//     // })
//   });
// });

const playerActionFoldButton = document.getElementsByName('fold');
playerActionFoldButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('fold button was clicked');

    document.getElementById('fold' + eachButton.value).hidden = 'hidden';
    document.getElementById('check' + eachButton.value).hidden = 'hidden';
    document.getElementById('raise' + eachButton.value).hidden = 'hidden';
    document.getElementById('call' + eachButton.value).hidden = 'hidden';
    document.getElementById(
      'allIn' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';

    //var socket = io.connect('/');
    socket.emit('playerActionFold', { player_id: eachButton.value });
    socket.on('foldMsg', function (id) {
      console.log('the client receives player id: ' + id + ' just folded');
    });
  });
});

const playerActionCallButton = document.getElementsByName('call');
playerActionCallButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('call button was clicked');

    document.getElementById('fold' + eachButton.value).hidden = 'hidden';
    document.getElementById('check' + eachButton.value).hidden = 'hidden';
    document.getElementById('raise' + eachButton.value).hidden = 'hidden';
    document.getElementById('call' + eachButton.value).hidden = 'hidden';
    document.getElementById(
      'allIn' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';

    //var socket = io.connect('/');
    socket.emit('playerActionCall', { player_id: eachButton.value });
    socket.on('callMsg', function (id) {
      console.log('the client receives player id: ' + id + ' just called.');
      document.getElementById('fold' + id).hidden = '';
      document.getElementById('check' + id).hidden = '';
      document.getElementById('raise' + id).hidden = '';
      document.getElementById('call' + id).hidden = '';
    });
  });
});

const playerActionAllInButton = document.getElementsByName('allIn');
playerActionAllInButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('allIn button was clicked');

    document.getElementById(
      'fold' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';
    document.getElementById(
      'check' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';
    document.getElementById(
      'raise' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';
    document.getElementById(
      'call' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';
    document.getElementById(
      'allIn' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';

    //var socket = io.connect('/');
    socket.emit('playerActionAllIn', {
      player_id: eachButton.getAttribute('id').slice(-1),
      bet: eachButton.value,
    });
    // socket.on('allInMsg', function (id) {
    //   console.log('the client receives player id: ' + id + ' just allIn.');
    //   document.getElementById('fold' + id).hidden = '';
    //   document.getElementById('check' + id).hidden = '';
    //   document.getElementById('raise' + id).hidden = '';
    //   document.getElementById('call' + id).hidden = '';
    // });
  });
});

const playerActionCheckButton = document.getElementsByName('check');
playerActionCheckButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('check button was clicked');

    document.getElementById('fold' + eachButton.value).hidden = 'hidden';
    document.getElementById('check' + eachButton.value).hidden = 'hidden';
    document.getElementById('raise' + eachButton.value).hidden = 'hidden';
    document.getElementById('call' + eachButton.value).hidden = 'hidden';
    document.getElementById(
      'allIn' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';

    //var socket = io.connect('/');
    socket.emit('playerActionCheck', { player_id: eachButton.value });
    socket.on('checkMsg', function (id) {
      console.log('the client receives player id: ' + id + ' just checked.');
      document.getElementById('fold' + id).hidden = '';
      document.getElementById('check' + id).hidden = '';
      document.getElementById('raise' + id).hidden = '';
      document.getElementById('call' + id).hidden = '';
    });
  });
});

const playerActionRaiseButton = document.getElementsByName('raise');
playerActionRaiseButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('raise button was clicked');
    document.getElementById('fold' + eachButton.value).hidden = 'hidden';
    document.getElementById('check' + eachButton.value).hidden = 'hidden';
    document.getElementById('raise' + eachButton.value).hidden = 'hidden';
    document.getElementById('call' + eachButton.value).hidden = 'hidden';
    document.getElementById(
      'allIn' + eachButton.getAttribute('id').slice(-1)
    ).hidden = 'hidden';
    document.getElementById('raiseSlider' + eachButton.value).style.display =
      '';

    //FIX: create html entry, display/set min, max under the slide bar
    const range = document.getElementById(
      'myRange' + eachButton.getAttribute('id').slice(-1)
    );
    console.log(range.min);
    console.log(range.max);
    console.log(range.value);
  });
});

const playerActionSlideButton = document.getElementsByName('myRange');
playerActionSlideButton.forEach(function (eachButton) {
  eachButton.addEventListener('mouseup', function (e) {
    console.log('betting ammount is ' + eachButton.value);
    socket.emit('playerActionRaise', {
      player_id: eachButton.getAttribute('id').slice(-1),
      bet: eachButton.value,
    });
    document.getElementById(
      'raiseSlider' + eachButton.getAttribute('id').slice(-1)
    ).style.display = 'none';
    document.getElementById(
      'amount' + eachButton.getAttribute('id').slice(-1)
    ).innerHTML = '';

    // document.getElementById(
    //   'check' + eachButton.getAttribute('id').slice(-1)
    // ).hidden = 'hidden';
    // document.getElementById(
    //   'call' + eachButton.getAttribute('id').slice(-1)
    // ).hidden = 'hidden';
    // document.getElementById(
    //   'fold' + eachButton.getAttribute('id').slice(-1)
    // ).hidden = 'hidden';
  });

  eachButton.addEventListener('input', function (e) {
    console.log('showing ammount ' + eachButton.value);
    document.getElementById(
      'amount' + eachButton.getAttribute('id').slice(-1)
    ).innerHTML = eachButton.value; //update <p>content</p> using innerHTML
  });
});

function internal_GetCardImageUrl(card) {
  var suit = card.substring(0, 1);
  var rank = parseInt(card.substring(1));
  rank = internal_FixTheRanking(rank); // 14 -> 'ace' etc
  suit = internal_FixTheSuiting(suit); // c  -> 'clubs' etc

  return 'images/' + rank + '_of_' + suit + '.png';
}

function internal_FixTheRanking(rank) {
  var ret_rank = 'NoRank';
  if (rank === 14) {
    ret_rank = 'ace';
  } else if (rank === 13) {
    ret_rank = 'king';
  } else if (rank === 12) {
    ret_rank = 'queen';
  } else if (rank === 11) {
    ret_rank = 'jack';
  } else if (rank > 0 && rank < 11) {
    // Normal card 1 - 10
    ret_rank = rank;
  } else {
    console.log(typeof rank);
    alert('Unknown rank ' + rank);
  }
  return ret_rank;
}

function internal_FixTheSuiting(suit) {
  if (suit === 'c') {
    suit = 'clubs';
  } else if (suit === 'd') {
    suit = 'diamonds';
  } else if (suit === 'h') {
    suit = 'hearts';
  } else if (suit === 's') {
    suit = 'spades';
  } else {
    alert('Unknown suit ' + suit);
    suit = 'yourself';
  }
  return suit;
}

//////////////////////////////////////////////////////
/////   Send http request using 'fetch'    ///////////
//////////////////////////////////////////////////////

// const radioButtons = document.getElementsByName('drone');
// radioButtons.forEach(function(eachButton){
//   eachButton.addEventListener('click', function(e) {
//     console.log('button was clicked');

//   fetch('/', {method: 'POST',   headers: {
//     'Content-Type': 'application/json;charset=utf-8'
//   }, body: JSON.stringify({player_id : eachButton.value})})
//     .then(function(response) {
//       if(response.ok) {
//         console.log('click was recorded');
//         return response.json();
//       }
//       throw new Error('Request failed.');
//     }).then(function(parsedResult) {
//       //parsedResult size, equals 1, show seat; equals 2, show seat, start dealing
//       //console.log(JSON.stringify(parsedResult[0].carda));

//       parsedResult.forEach(function(eachResult) {
//         pos = eachResult.player_id;
//         document.getElementById('img'+pos+'a').src=internal_GetCardImageUrl(eachResult.carda);
//         document.getElementById('img'+pos+'b').src=internal_GetCardImageUrl(eachResult.cardb);
//       })

//       // result = parsedResult[0].carda;
//       // document.getElementById('img1').src=internal_GetCardImageUrl(result);
//       }, function(statusCode) {
//         console.log('first player feedback.');
//     })
//     .catch(function(error) {
//       console.log(error);
//     });
//   });
// } )

// button2.addEventListener('click', function(e) {
//   console.log('button was clicked');

// fetch('/', {method: 'POST',   headers: {
//   'Content-Type': 'application/json;charset=utf-8'
// }, body: JSON.stringify(player2)})
//   .then(function(response) {
//     if(response.ok) {
//       console.log('click was recorded');
//       return response.json();
//     }
//     throw new Error('Request failed.');
//   }).then(function(parsedResult) {
//     console.log(JSON.stringify(parsedResult[0].carda));
//     result = parsedResult[0].carda;
//     document.getElementById('img1').src=internal_GetCardImageUrl(result);
//     }, function(statusCode) {
//       console.log('first player feedback.');
//   })
//   .catch(function(error) {
//     console.log(error);
//   });
// });

const seatButton = document.getElementsByName('seat');
seatButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('button was clicked');

    updatePlayerSeat(eachButton.value);
    for (var i = 1; i < 8; i++) {
      //set other seats non-clickable
      if (i != eachButton.value) {
        document.getElementById('playerSeat' + i).disabled = true;
      }
    }
    socket.emit('joinGameEvent', { player_id: eachButton.value });
  });
});

// const joinSeatButton = document.getElementsByName('seat');
// joinSeatButton.forEach(function (eachButton) {
//   eachButton.addEventListener('click', function (e) {
//     console.log('button was clicked');

//     updatePlayerSeat(eachButton);

//     socket.emit('joinGameEvent', { player_id: eachButton.value });
//     socket.on('faceDownCards', function (player) {
//       console.log('the client receives player list: ' + player);
//       console.log('the client receives player carda: ' + player.carda);
//       document.getElementById(
//         'img' + player.player_id + 'a'
//       ).src = internal_GetCardImageUrl(player.carda);
//       document.getElementById('img' + player.player_id + 'a').width = 100;
//       document.getElementById('img' + player.player_id + 'a').height = 140;
//       document.getElementById(
//         'img' + player.player_id + 'b'
//       ).src = internal_GetCardImageUrl(player.cardb);
//       document.getElementById('img' + player.player_id + 'b').width = 100;
//       document.getElementById('img' + player.player_id + 'b').height = 140;
//       document.getElementById('imgFlopCard0').hidden = 'hidden';
//       document.getElementById('imgFlopCard1').hidden = 'hidden';
//       document.getElementById('imgFlopCard2').hidden = 'hidden';
//       document.getElementById('imgTurnCard').hidden = 'hidden';
//       document.getElementById('imgRiverCard').hidden = 'hidden';
//     });

//     // socket.on('layCards', function (cards) {
//     //   console.log('community cards are: '+ cards);
//     // })
//     socket.on('message2', function (msg) {
//       console.log('the client receives player msg: ' + msg);
//     });
//     // socket.on('options', function (id) {
//     //   console.log('the client receives player id: ' + id);
//     //   document.getElementById('fold'+id).hidden = "";
//     //   document.getElementById('check'+id).hidden = "";
//     //   document.getElementById('raise'+id).hidden = "";
//     //   document.getElementById('call'+id).hidden = "";
//     // })
//   });
// });

//update player DOM
function updatePlayerSeat(seatId) {
  for (var i = 1; i < 8; i++) {
    if (seatId - 1 + i <= 7) {
      document
        .getElementById('playerBox' + i)
        .appendChild(document.getElementById('playerSeat' + (seatId - 1 + i)));
      document
        .getElementById('playerBox' + i)
        .appendChild(document.getElementById('info' + (seatId - 1 + i)));
      document
        .getElementById('playerBox' + i)
        .appendChild(document.getElementById('button' + (seatId - 1 + i)));
      document
        .getElementById('playerBox' + i)
        .appendChild(
          document.getElementById('playerInfoBox' + (seatId - 1 + i))
        );
      document
        .getElementById('playerInfoBox' + (seatId - 1 + i))
        .appendChild(document.getElementById('account' + (seatId - 1 + i)));
      document
        .getElementById('playerInfoBox' + (seatId - 1 + i))
        .appendChild(
          document.getElementById('accountBalance' + (seatId - 1 + i))
        );

      document
        .getElementById('cardBox' + i)
        .appendChild(document.getElementById('img' + (seatId - 1 + i) + 'a'));
      document
        .getElementById('cardBox' + i)
        .appendChild(document.getElementById('img' + (seatId - 1 + i) + 'b'));
    } else {
      document
        .getElementById('playerBox' + i)
        .appendChild(document.getElementById('playerSeat' + (seatId - 8 + i)));
      document
        .getElementById('playerBox' + i)
        .appendChild(document.getElementById('info' + (seatId - 8 + i)));
      document
        .getElementById('playerBox' + i)
        .appendChild(document.getElementById('button' + (seatId - 8 + i)));
      document
        .getElementById('playerBox' + i)
        .appendChild(
          document.getElementById('playerInfoBox' + (seatId - 8 + i))
        );
      document
        .getElementById('playerInfoBox' + (seatId - 8 + i))
        .appendChild(document.getElementById('account' + (seatId - 8 + i)));
      document
        .getElementById('playerInfoBox' + (seatId - 8 + i))
        .appendChild(
          document.getElementById('accountBalance' + (seatId - 8 + i))
        );
      document
        .getElementById('cardBox' + i)
        .appendChild(document.getElementById('img' + (seatId - 8 + i) + 'a'));
      document
        .getElementById('cardBox' + i)
        .appendChild(document.getElementById('img' + (seatId - 8 + i) + 'b'));
    }

    document.getElementById('playerSeat' + seatId).src = 'images/user.png.png';
    document.getElementById('playerSeat' + seatId).disabled = true;
  }
}

socket.on('faceDownCards', function (playerObj) {
  console.log('the client receives player list: ' + playerObj.player);
  console.log('the client receives player carda: ' + playerObj.player.carda);
  document.getElementById(
    'img' + playerObj.player.player_id + 'a'
  ).src = internal_GetCardImageUrl(playerObj.player.carda);
  document.getElementById('img' + playerObj.player.player_id + 'a').width = 50;
  document.getElementById('img' + playerObj.player.player_id + 'a').height = 65;
  document.getElementById(
    'img' + playerObj.player.player_id + 'b'
  ).src = internal_GetCardImageUrl(playerObj.player.cardb);
  document.getElementById('img' + playerObj.player.player_id + 'b').width = 50;
  document.getElementById('img' + playerObj.player.player_id + 'b').height = 65;
  for (var i = 0; i < playerObj.allPlayers.length; i++) {
    if (playerObj.allPlayers[i].status == 'active') {
      if (playerObj.allPlayers[i].player_id != playerObj.player.player_id) {
        document.getElementById(
          'img' + playerObj.allPlayers[i].player_id + 'a'
        ).src = 'images/cardback.png';
        document.getElementById(
          'img' + playerObj.allPlayers[i].player_id + 'a'
        ).width = 50;
        document.getElementById(
          'img' + playerObj.allPlayers[i].player_id + 'a'
        ).height = 65;
        document.getElementById(
          'img' + playerObj.allPlayers[i].player_id + 'b'
        ).src = 'images/cardback.png';
        document.getElementById(
          'img' + playerObj.allPlayers[i].player_id + 'b'
        ).width = 50;
        document.getElementById(
          'img' + playerObj.allPlayers[i].player_id + 'b'
        ).height = 65;
      }
    }
  }

  document.getElementById('imgFlopCard0').hidden = 'hidden';
  document.getElementById('imgFlopCard1').hidden = 'hidden';
  document.getElementById('imgFlopCard2').hidden = 'hidden';
  document.getElementById('imgTurnCard').hidden = 'hidden';
  document.getElementById('imgRiverCard').hidden = 'hidden';
});

socket.on('showFaceDownCards', function (player) {
  console.log('the client receives all in: ' + player.player_id);
  document.getElementById(
    'img' + player.player_id + 'a'
  ).src = internal_GetCardImageUrl(player.carda);
  document.getElementById('img' + player.player_id + 'a').width = 50;
  document.getElementById('img' + player.player_id + 'a').height = 65;
  document.getElementById(
    'img' + player.player_id + 'b'
  ).src = internal_GetCardImageUrl(player.cardb);
  document.getElementById('img' + player.player_id + 'b').width = 50;
  document.getElementById('img' + player.player_id + 'b').height = 65;
});
