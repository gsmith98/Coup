"use strict";

var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');
var interactionsConstructor = require('./interactions');
var actionToCharacter = require('./actionToCharacter');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.json({success: true});
});

var Game = require('./game');
var game = new Game();

io.on('connection', function(socket){
  console.log('connected');
  var interactions = interactionsConstructor(socket, game);
  var socketUser; //the user who sent whatever event is being handled in here //TODO refactor to use

  socket.on("endGame", function(){
    if(game.getWinner()){
      socket.emit('gameEnd', game.getWinner())
    }
  })

  socket.on('username', function(username) {
    console.log(username)
    try {
      var id = game.addPlayer(username);
      console.log("after add " + username + " game is", game.players);
      socket.playerId = id;
      socketUser = username;
      socket.broadcast.emit('newUser', username);
    } catch(e) {
      socket.emit('username', false);
      console.error(e);
      socket.emit("errorMessage", e);
    }
  });

  socket.on('requestState', () => {
    socket.emit(socketUser + "newGameStatus", game.getPlayerPerspective(socketUser)); //TODO channel name needn't use socketUser, emit goes only to requester
  });

  socket.on('action', function(action) {
    console.log("Action recieved from " + socketUser);
    console.log("currentPlayer should be " + game.currentPlayer().username);
    if (!action) {
      return socket.emit('errorMessage', 'No action provided!');
    } else if (game.currentPlayer().username !== socketUser) {
      return socket.emit('errorMessage', "Not your turn!");
    }

    switch(action.action) {
      case "ASSASSINATE": //TODO check for coins?
        game.takeAction(action); //just deducts coins //NO BREAK! falls into character specific action
        interactions.updateClients();
      case "TAX":
      case "STEAL":
      case "EXCHANGE":
        interactions.characterSpecificAction(action);
        break;
      case "INCOME":
        interactions.performAction(action);
        break;
      case "COUP": //TODO check for coins?
        game.takeAction(action); //just deducts coins
        interactions.updateClients();
        interactions.askToLoseInfluence(action.targetPlayer, {reason: "Couped", attemptedAction: action})
        break;
      case "FOREIGN AID":
        interactions.blockableAction(action);
        break;
      default:
        console.log("invalid action type");
        socket.emit('errorMessage', "Invalid action!");
    }
  });




  //data will include action: actionObj, bs: bool, username: who <- cannot be refactored ton use socketUser
  socket.on('BS', (data) => {
    console.log(data);
    interactions.addResponse(data);
    //once all responses are gathered
    if (interactions.allResponsesGathered()) {
      //check for the first positive response if any
      if (!interactions.someResponse(x => {
        if (!x.bs) {
          console.log("Not Bullshit");
          return false;
        } else {
          //handle BS call
          console.log("Yes to Bullshit");        //TODO need a switch for acting player and such
          var loser = game.whoLostChallenge(x.username, x.action.player, actionToCharacter[x.action.action]);
          if (loser === x.action.player) {
            console.log("rejected call back");
            interactions.askToLoseInfluence(loser, {reason: "Called Out", attemptedAction: x.action});
          } else {
            console.log("Yes to action call back!");
            interactions.askToLoseInfluence(loser, {reason: "Bad BS", attemptedAction: x.action});
          }
          return true
        }
      })) {
        console.log("No Bullshit action call back");
        interactions.BSables[data.action.action].allowed(data.action);
      }
    }
  });

  socket.on('block', (data) => {
    console.log(data);
    interactions.addResponse(data);
    //once all responses are gathered
    if (interactions.allResponsesGathered()) {
      //check for the first positive response if any
      if (!interactions.someResponse(x => {
        if (!x.block) {
          console.log("Not blocked");
          return false;
        } else {
          console.log("Yes to block!");
          interactions.characterSpecificAction(data.action);
        }
        return true;
      })) {
        console.log("No block callback");
        interactions.blockables[data.action.action].notBlocked(data.action);
      }
    }
  });

  // data has chosenRole, attemptedAction, reason
  socket.on("LostInfluence", (data) => {
    console.log(socketUser + " chose to lose " + data.chosenRole);
    game.getPlayer(socketUser).loseInfluence(data.chosenRole);
    interactions.updateClients();

    //what should happen after the lost influence?
    switch (data.reason) {
      case "Called Out":
        console.log("interactions.BSables disallowed for called out");
        interactions.BSables[data.attemptedAction.action].disallowed(data.attemptedAction);
        break;
      case "Bad BS":
        console.log("interactions.BSables allowed for bad bs");
        interactions.BSables[data.attemptedAction.action].allowed(data.attemptedAction);
        break;
      case "Couped":
      case "Assassinated":
        interactions.moveOn();
        break;
      default:
        console.log("DEFAULT!!!!! SHOULDN'T BE HERE!!!!!");
    }

  });

  //data should send an influence array and a returned card array
  // kept: [{role: Duke, alive: false}, {role: Assassin, alive: true}]  returned: ["Duke", "Captain"]
  socket.on("AmbassadorDecision", (data) => {
    console.log("AmbassadorDecision", data);
    game.ambassadorDecision(socketUser, data.kept, data.returned);
    interactions.moveOn();
    interactions.updateClients();
  });

  socket.on('startGame', () => {
    try {
      game.startGame();
      socket.emit("gameIsStarting", null);
      socket.broadcast.emit("gameIsStarting", null);
    } catch (e) {
      console.error(e);
      socket.emit("errorMessage", e);
    }
  });
});


var port = process.env.PORT || 8080;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
