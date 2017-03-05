module.exports = function(socket, game) {
  function moveOn() {
    console.log("Move on called");
    game.nextPlayer();
    socket.emit("updateStatus", null);
    socket.broadcast.emit("updateStatus", null);
  }

  function performAction(action) {
    console.log("performAction called with action ", action.action);
    game.takeAction(action);
    game.nextPlayer();
    socket.emit("updateStatus", null);
    socket.broadcast.emit("updateStatus", null);
  }

 return (
  {
    "TAX": {
      allowed: performAction,
      disallowed: moveOn
    },
    "STEAL": {
      allowed: function (action) {
        blockableAction(action) //emits blockChance //TODO write
      },
      disallowed: moveOn
    },
    "BLOCK STEAL CAPTAIN": {
      allowed: moveOn,
      disallowed: function (action) {
        action.action = "STEAL";
        performAction(action);
      }
    },
    "BLOCK STEAL AMBASSADOR": {
      allowed: moveOn,
      disallowed: function (action) {
        action.action = "STEAL";
        performAction(action);
      }
    }
    //TODO EXCHANGE, ASSASSINATE, BLOCK ASSASSINATE, BLOCK FOREIGN AID
  });
};
