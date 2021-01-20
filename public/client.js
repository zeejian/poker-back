console.log('Client-side code running');

//////////////////////////////////////////////////////
/////   Send request using 'socket.io'    ///////////
//////////////////////////////////////////////////////
var socket = io.connect('/');
socket.on('layFlopCards', function (cards) {
  console.log('flop cards are: ' + cards);
  for (var i = 0; i < cards.length; i++) {
    document.getElementById('imgFlopCard' + i).hidden = '';
    document.getElementById('imgFlopCard' + i).src = internal_GetCardImageUrl(
      cards[i]
    );
    document.getElementById('imgFlopCard' + i).width = 100;
    document.getElementById('imgFlopCard' + i).height = 140;
  }
});

socket.on('layTurnCard', function (cards) {
  console.log('turn card is: ' + cards);
  document.getElementById('imgTurnCard').hidden = '';
  document.getElementById('imgTurnCard').src = internal_GetCardImageUrl(cards);
  document.getElementById('imgTurnCard').width = 100;
  document.getElementById('imgTurnCard').height = 140;
});

socket.on('layRiverCard', function (cards) {
  console.log('river card is: ' + cards);
  document.getElementById('imgRiverCard').hidden = '';
  document.getElementById('imgRiverCard').src = internal_GetCardImageUrl(cards);
  document.getElementById('imgRiverCard').width = 100;
  document.getElementById('imgRiverCard').height = 140;
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

socket.on('winnerMsg', function(player){
  id = player.player_id;
  console.log('the client receives winnerMsg event, with player id: ' + id);

  document.getElementById('shownMsg'+id).hidden = '';
  document.getElementById('shownMsg'+id).innerHTML = 'Congratulations! YOU WIN!';
  //highlight the winning card

})

socket.on('losersMsg', function(player){
  id = player.player_id;
  console.log('the client receives losersMsg event, with player id: ' + id);

})

const joinSeatButton = document.getElementsByName('seat');
joinSeatButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('button was clicked');

    socket.emit('joinGameEvent', { player_id: eachButton.value });
    socket.on('faceDownCards', function (player) {
      console.log('the client receives player list: ' + player);
      console.log('the client receives player carda: ' + player.carda);
      document.getElementById(
        'img' + player.player_id + 'a'
      ).src = internal_GetCardImageUrl(player.carda);
      document.getElementById('img' + player.player_id + 'a').width = 100;
      document.getElementById('img' + player.player_id + 'a').height = 140;
      document.getElementById(
        'img' + player.player_id + 'b'
      ).src = internal_GetCardImageUrl(player.cardb);
      document.getElementById('img' + player.player_id + 'b').width = 100;
      document.getElementById('img' + player.player_id + 'b').height = 140;
      document.getElementById('imgFlopCard0').hidden = 'hidden';
      document.getElementById('imgFlopCard1').hidden = 'hidden';
      document.getElementById('imgFlopCard2').hidden = 'hidden';
      document.getElementById('imgTurnCard').hidden = 'hidden';
      document.getElementById('imgRiverCard').hidden = 'hidden';
    });

    // socket.on('layCards', function (cards) {
    //   console.log('community cards are: '+ cards);
    // })
    socket.on('message2', function (msg) {
      console.log('the client receives player msg: ' + msg);
    });
    // socket.on('options', function (id) {
    //   console.log('the client receives player id: ' + id);
    //   document.getElementById('fold'+id).hidden = "";
    //   document.getElementById('check'+id).hidden = "";
    //   document.getElementById('raise'+id).hidden = "";
    //   document.getElementById('call'+id).hidden = "";
    // })
  });
});

const playerActionFoldButton = document.getElementsByName('fold');
playerActionFoldButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('fold button was clicked');

    document.getElementById('fold' + eachButton.value).hidden = 'hidden';
    document.getElementById('check' + eachButton.value).hidden = 'hidden';
    document.getElementById('raise' + eachButton.value).hidden = 'hidden';
    document.getElementById('call' + eachButton.value).hidden = 'hidden';

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

const playerActionCheckButton = document.getElementsByName('check');
playerActionCheckButton.forEach(function (eachButton) {
  eachButton.addEventListener('click', function (e) {
    console.log('check button was clicked');

    document.getElementById('fold' + eachButton.value).hidden = 'hidden';
    document.getElementById('check' + eachButton.value).hidden = 'hidden';
    document.getElementById('raise' + eachButton.value).hidden = 'hidden';
    document.getElementById('call' + eachButton.value).hidden = 'hidden';

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
    document.getElementById('raiseSlider' + eachButton.value).style.display =
      '';
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
