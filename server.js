"use strict";

var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');
var bsableConstructor = require('./bsables');
var actionToCharacter = require('./actionToCharacter');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.json({success: true});
});

var Game = require('./game');
var game = new Game();

//server variable to collect responses to most recent poll emission (BSchance, blockChance)
var responses = [];

io.on('connection', function(socket){
  console.log('connected');
  var socketUser; //the user who sent whatever event is being handled in here //TODO refactor to use
  var BSables = bsableConstructor(socket, game);

  socket.on('username', function(username) {
    console.log(username)
    try {
      var id = game.addPlayer(username);
      socket.playerId = id;
      socketUser = username;
    } catch(e) { //TODO Try catch all socket
      socket.emit('username', false);
      return console.error(e);
    }

    socket.broadcast.emit('newUser', username);
  });

  socket.on('requestState', () => {
    socket.emit(socketUser + "newGameStatus", game.getPlayerPerspective(socketUser)); //TODO channel name needn't use socketUser, emit goes only to requester
  });


  socket.on('action', function(action) {
    console.log("Action recieved!");
    if (!action) {
      return socket.emit('errorMessage', 'Please Click Action');
    }

    //TODO switch
    //case TAX, STEAL, EXCHANGE, ASSASSINATE
    characterSpecificAction(action);
    //case FOREIGN AID
    // blockableAction
    //case INCOME, COUP
    // perform action
    // switch(data.action) {
    //   case "INCOME":
    //
    //     break;
    //   case "FOREIGN AID":
    //
    //     break;
    //   case "COUP":
    //
    //
    //     break;
    //   case "TAX":
    //   characterSpecificAction(data.player, "Duke", taxSuccess, taxCalledOut)
    //     break;
    //   case "ASSASSINATE":
    //
    //
    //     break;
    //   case "STEAL":
    //
    //     break;
    //   case "EXCHANGE":
    //
    //     break;
    //   default:
    //     throw "Not a valid action!"
    // }

  });

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
            if (loser === x.action.player) {
              console.log("rejected call back");
              askToLoseInfluence(loser, {reason: "Called Out", attemptedAction: x.action});
            } else {
              console.log("Yes to action call back!");
              askToLoseInfluence(loser, {reason: "Bad BS", attemptedAction: x.action});
            }
            return true
          }
        })) {
          console.log("No Bullshit action call back");
          BSables[data.action.action].allowed(data.action);
        }
        responses = [];
      }
    })

  // data has chosenRole, attemptedAction, reason
  socket.on("LostInfluence", (data) => {
    console.log(socketUser + " chose to lose " + data.chosenRole);
    game.getPlayer(socketUser).loseInfluence(data.chosenRole);

    switch (data.reason) {
      case "Called Out":
        console.log("BSables disallowed for called out");
        BSables[data.attemptedAction.action].disallowed();
        break;
      case "Bad BS":
        console.log("BSables allowed for bad bs");
        BSables[data.attemptedAction.action].allowed(data.attemptedAction);
        break;
      default:
        console.log("DEFAULT!!!!! SHOULDN'T BE HERE!!!!!");
    }

  });

  function askToLoseInfluence(losingPlayer, lossDetails) {
    console.log("lossing player has lose: ", losingPlayer);
    console.log("loss details", lossDetails);
    socket.broadcast.emit(losingPlayer, lossDetails);
    socket.emit(losingPlayer, lossDetails)
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
});


var port = process.env.PORT || 8080;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
