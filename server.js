"use strict";

var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.json({success: true});
});

var Game = require('./game');
var game = new Game();

var responses = [];

io.on('connection', function(socket){
  console.log('connected');
  var socketUser; //the user who sent whatever event is being handled in here //TODO refactor to use

  function moveOn() {
    console.log("Move on called");
    game.nextPlayer();
  }

  function performAction(action) {
    console.log("performAction called with action ", action.action);
    game.takeAction(action);
    game.nextPlayer();
  }

  var BSables = {
    "TAX": {
      allowed: performAction,
      disallowed: moveOn
    },
    "STEAL": {
      allowed: function (action) {
        blockableAction(action) //emits blockChance
      },
      disallowed: moveOn
    },
    "BLOCK STEAL": {
      allowed: moveOn,
      disallowed: function (action) {
        action.action = "STEAL";
        performAction(action);
      }
    }
  };

  var actionToCharacter = {
    "TAX": "Duke",
    "STEAL": "Captain"
  }

  //// characterSpecificAction(action.player, "Duke", "takeActionAndMoveOn", "moveOn", actionObj);
  function characterSpecificAction(actionObj) {
    //emit bs opportunity to all other players (broadcast)
    console.log("11111111111111");
    responses = [];
    socket.broadcast.emit("BSchance", actionObj);
  };

  //data will include action: actionObj, bs: bool, username: who <- cannot be refactored ton use socketUser
  socket.on('BS', (data) => {
      console.log(data);
      responses.push(data);
      //once all responses are gathered
      if (responses.length === game.numPlayers() - 1) {
        //check for the first positive response if any
        if (!responses.some(x => {
          if (!x.bs) {
            console.log("Not Bullshit");
            return false;
          } else {
            //handle BS call
            console.log("Yes to Bullshit");
            var loser = game.whoLostChallenge(x.username, x.action.player, actionToCharacter[x.action.action]);
            askToLoseInfluence(loser, () => { //TODO make work
              if (loser === actingPlayer) {
                console.log("rejected call back");
                BSables[x.action.action].disallowed();
              } else {
                console.log("Yes to action call back!");
                BSables[x.action.action].allowed(x.action);
              }
            });
            return true
          }s
        })) {
          console.log("No Bullshit action call back");
          BSables[data.action.action].allowed(data.action);
        }
        responses = [];
      }
    })


  socket.on("LostInfluence", (data) => {
    game.getPlayer(socketUser).loseInfluence(data.chosenRole);
    callback();
  });

  function askToLoseInfluence(losingPlayer, callback) {
    console.log("lossing player has lose: ", losingPlayer);
    socket.emit(losingPlayer,null);
  }

    //
    // //Examples!!!!
    //
    // //Example when Lisa Taxes
    // function taxSuccess() {
    //   game.takeAction({player: "Lisa", action: "TAX"});
    //   game.nextPlayer();
    // };
    // function taxCalledOut() {
    //   game.nextPlayer();
    // };
    // characterSpecificAction("Lisa", "Duke", taxSuccess, taxCalledOut)
    //
    // //Example when Don Assassinates Junjie
    // function assassinateSuccess() {
    //   game.takeAction({player: "Don", action: "ASSASSINATE", targetPlayer: "Junjie"}); //pays 3 coins
    //   askToLoseInfluence("Junjie", () => { //causes death
    //     game.nextPlayer(); //moves on
    //   });
    // }
    //
    // function assassinateCalledOut() {
    //   game.takeAction({player: "Don", action: "ASSASSINATE", targetPlayer: "Junjie"});  //pays 3 coins
    //   game.nextPlayer(); //moves on
    // }
    //
    // characterSpecificAction("Don", "Assassin", blockableAction("Don", "Assassin", "Junjie", assassinateSuccess, assassinateCalledOut), assassinateCalledOut);
    //

    // blockableAction() //

  socket.on('username', function(username) {
    console.log(username)
    try {
      var id = game.addPlayer(username);
      socket.playerId = id;
      socketUser = username;
    } catch(e) {
      socket.emit('username', false);
      return console.error(e);
    }
    socket.emit('username', id);
    socket.emit('updateGame', game.getPlayerPerspective(username));
  });

  socket.on('requestState', () => {
    socket.emit(socketUser + "newGameStatus", game.getPlayerPerspective(socketUser));
  })

  //
  // socket.on('roomCheck', function() {
  //   if (!socket.username) {
  //    return socket.emit('errorMessage', 'Username not set!');
  //   }
  //   if (socket.room) {
  //     socket.leave(socket.room);
  //   }
  //
  //
  //  });
  //
  socket.on('action', function(action) {
    console.log("Action recieved!");
    if (!action) {
      return socket.emit('errorMessage', 'Please Click Action');
    }

    characterSpecificAction(action);


  })
  //
  // socket.on('refreshCard', function(action) {
  //
  //
  // });
  //
  // socket.on('playerLoss', function(action) {
  //
  //
  // });

});


var port = process.env.PORT || 8080;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
