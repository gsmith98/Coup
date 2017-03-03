"use strict";

var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.json({success: true});
});

var Game = require('./game');
var game = new Game();

io.on('connect', function(socket){
  //socket routes
  console.log('connected');
  socket.on('username', function(username) {
    if (!username || !username.trim()) {
      return socket.emit('errorMessage', 'No username!');
    }
    socket.username = String(username);
  });

  socket.on('roomCheck', function() {
    if (!socket.username) {
     return socket.emit('errorMessage', 'Username not set!');
    }
    if (socket.room) {
      socket.leave(socket.room);
    }


   });

  socket.on('gameAction', function(action) {
    if (!action) {
      return socket.emit('errorMessage', 'Please Click Action');
    }

    socket.to(socket.room).emit('gameAction', {
      username: socket.username,
      action: socket.username
    });

  })

  socket.on('refreshCard', function(action) {


  });

  socket.on('playerLoss', function(action) {


  });

});


var port = process.env.PORT || 8081;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
