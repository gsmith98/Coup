"use strict";

var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.json({success: true});
});

var Game = require('./game');
var game = new Game();

io.on('connection', function(socket){
  //socket routes
  console.log('connected');
  socket.on('username', function(username) {
    if (!username || !username.trim()) {
      return socket.emit('errorMessage', 'No username!');
    }
    socket.username = String(username);
  });

  socket.on('gameAction', function(action) {
    if (!action) {
      return socket.emit('errorMessage', 'Please Click Action');
    }

    socket.to(socket.room).emit('gameAction', {
      username: socket.username,
      action:
    });

  })

});


var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
