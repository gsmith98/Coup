var responses = [];
var expectedResponses = -1;

module.exports = function(socket, game, blockableAction) {
  function addResponse(resp) {
    responses.push(resp);
  };

  function allResponsesGathered() {
    return responses.length === expectedResponses;
  };

  function someResponse(fn) {
    return responses.some(fn);
  };

  function updateClients() {
    socket.emit("updateStatus", null);
    socket.broadcast.emit("updateStatus", null);
    var winner = game.getWinner();
    if (winner) {
      socket.emit("gameEnd", winner);
      socket.broadcast.emit("gameEnd", winner);
    }
  };

  function moveOn() {
    console.log("Move on called");
    game.nextPlayer();
    updateClients();
  };

  function performAction(action) {
    console.log("performAction called with action ", action.action);
    game.takeAction(action);
    game.nextPlayer();
    updateClients();
  };

  function characterSpecificAction(actionObj) {
    //emit bs opportunity to all other players (broadcast)
    console.log("characterSpecificAction");
    responses = [];
    expectedResponses = game.numAlivePlayers() - 1;
    socket.broadcast.emit("BSchance", actionObj); //TODO need to emit also? and have client check if it's you?
  };

  function blockableAction(actionObj) {
    console.log("blockableAction");
    responses = [];
    expectedResponses = (actionObj.action === "FOREIGN AID") ? game.numAlivePlayers() - 1 : 1;
    socket.emit("blockChance", actionObj);
    socket.broadcast.emit("blockChance", actionObj); //emit to all players, client is responsible for only reacting if appropriate
  };

  function askToLoseInfluence(losingPlayer, lossDetails) {
    console.log("lossing player has lose: ", losingPlayer);
    console.log("loss details", lossDetails);
    socket.broadcast.emit(losingPlayer, lossDetails);
    socket.emit(losingPlayer, lossDetails)
  };

  var BSables =
  {
    "TAX": {
      allowed: performAction,
      disallowed: moveOn
    },
    "STEAL": {
      allowed: function (action) {
        if (game.isAlive(action.targetPlayer)) {
          blockableAction(action)
        } else {
          performAction(action);
        }
      },
      disallowed: moveOn
    },
    "BLOCK STEAL CAPTAIN": {
      allowed: moveOn,
      disallowed: function (action) {
        action.action = "STEAL";
        var temp = action.player;
        action.player = action.targetPlayer;
        action.targetPlayer = temp;
        performAction(action);
      }
    },
    "BLOCK STEAL AMBASSADOR": {
      allowed: moveOn,
      disallowed: function (action) {
        action.action = "STEAL";
        var temp = action.player;
        action.player = action.targetPlayer;
        action.targetPlayer = temp;
        performAction(action);
      }
    },
    "BLOCK FOREIGN AID": {
      allowed: moveOn,
      disallowed: function(action) {
        action.action = "FOREIGN AID";
        action.player = action.targetPlayer;
        action.targetPlayer = null;
        performAction(action);
      }
    },
    "ASSASSINATE": {
      allowed: function(action) {
        if (game.isAlive(action.targetPlayer)) {
          blockableAction(action);
        } else {
          moveOn();
        }
      },
      disallowed: moveOn
    },
    "BLOCK ASSASSINATE": {
      allowed: moveOn,
      disallowed: function (action) {
        action.action = "ASSASSINATE";
        var temp = action.player;
        action.player = action.targetPlayer;
        action.targetPlayer = temp;
        askToLoseInfluence(action.targetPlayer, {reason: "Assassinated", attemptedAction: action});
      }
    },
    "EXCHANGE": {
      allowed: function(action) {
        var drawn = game.drawFromCourtDeck(2);
        socket.emit("ambassadorCardsFor" + action.player, drawn);
        socket.broadcast.emit("ambassadorCardsFor" + action.player, drawn);
      },
      disallowed: moveOn
    }
  };

  var blockables =
  {
    "STEAL": {
      blocked: function (action) { //client will respond to block with changed action type: "BLOCK STEAL CAPTAIN"
        console.log("blocked");
        characterSpecificAction(action); //TODO make this anonymous function just characterSpecificAction
      },
      notBlocked: function (action) {
        console.log("not blocked");
        performAction(action); //TODO make this anonymous function just performAction
      }
    },
    "FOREIGN AID": {
      blocked: function (action) { //client will respond to block with changed action type: "BLOCK STEAL Ambassador"
        console.log("blocked");
        characterSpecificAction(action); //TODO make this anonymous function just characterSpecificAction
      },
      notBlocked: function (action) {
        console.log("not blocked");
        performAction(action); //TODO make this anonymous function just performAction
      }
    },
    "ASSASSINATE": {
      blocked: function (action) { //client will respond to block with changed action type: "BLOCK ASSASSINATE"
        console.log("blocked");
        characterSpecificAction(action); //TODO make this anonymous function just characterSpecificAction
      },
      notBlocked: function (action) {
        console.log("not blocked");
        askToLoseInfluence(action.targetPlayer, {reason: "Assassinated", attemptedAction: action});
      }
    }
  };

  return {
    addResponse,
    allResponsesGathered,
    someResponse,
    updateClients,
    moveOn,
    performAction,
    characterSpecificAction,
    blockableAction,
    askToLoseInfluence,
    BSables,
    blockables
  };
};
