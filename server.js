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

function getGameState(){
  var numCards = {};
  var currentPlayerUsername;
  var players = "";

  numCards = _.mapObject(game.players,(function(player, playerId){

    if(playerId == game.currentPlayer){
      currentPlayerUsername = player.username;
    }
    players += player.username + ", ";



    return player.pile.length;
  }));


  _.forEach(game.players,function(player, playerId){
    console.log(player.username, player.pile.length, game.pile.length);
  })

  return {
      numCards: numCards || "You don't have cards yet",
      currentPlayerUsername: currentPlayerUsername || "Game not started",
      playersInGame: players,
      cardsInDeck: game.pile.length,
  }
}

io.on('connection', function(socket){
  console.log('connected');

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
