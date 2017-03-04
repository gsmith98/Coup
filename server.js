"use strict";

var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.json({success: true});
});

var Game = require('./game');
var game = new Game();


io.on('connection', function(socket){
  console.log('connected');
  function askToLoseInfluence(losingPlayer, callback) {
    socket.emit(losingPlayer, {loseInfluence: true}); //TODO revisit the sent object
    socket.on("LostInfluence", (data) => {
      game.getPlayer(losingPlayer).loseInfluence(data.chosenRole);
      callback();
    });
  }

  //the callback is whatever should happen after all responses are collected
  function characterSpecificAction(actingPlayer, claimedCharacter, actionCallback, rejectedCallback) {
    //emit bs opportunity to all other players (broadcast)
    socket.broadcast.emit("BSchance", {actingPlayer, claimedCharacter});
    var responses = [];
    //await all responses
    socket.on('BS', (data) => {
        console.log(data);
        responses.push(data);
        //once all responses are gathered
        if (responses.length === game.numPlayers() - 1) { //TODO write game.numPlayers()
          //check for the first positive response if any
          if (!responses.some(x => {
            if (!x.bs) {
              return false;
            } else {
              //handle BS call
              var loser = game.whoLostChallenge(x.username, actingPlayer, claimedCharacter);
              askToLoseInfluence(loser, () => {
                if (loser === actingPlayer) {
                  rejectedCallback();
                } else {
                  actionCallback()
                }
              });
              return true
            }
          })) {
              actionCallback();
          }
        }
      }
    });
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





  socket.on('username', function(username) {
    try {
      var id = game.addPlayer(data);
      socket.playerId = id;
    } catch(e) {
      socket.emit('username', false);
      return console.error(e);
    }
    socket.emit('username', id);
    socket.emit('updateGame', getGameState());
    socket.broadcast.emit('updateGame', getGameState());
  });

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
  // socket.on('gameAction', function(action) {
  //   if (!action) {
  //     return socket.emit('errorMessage', 'Please Click Action');
  //   }
  //
  //   socket.to(socket.room).emit('gameAction', {
  //     username: socket.username,
  //     action: socket.username
  //   });
  //
  // })
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


var port = process.env.PORT || 8081;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
