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

  function moveOn() {
    console.log("Move on called");
    game.nextPlayer();
    socket.emit("updateStatus", null);
    socket.broadcast.emit("updateStatus", null);
  };

  function performAction(action) {
    console.log("performAction called with action ", action.action);
    game.takeAction(action);
    game.nextPlayer();
    socket.emit("updateStatus", null);
    socket.broadcast.emit("updateStatus", null);
  };

  function characterSpecificAction(actionObj) {
    //emit bs opportunity to all other players (broadcast)
    console.log("11111111111111");
    responses = [];
    expectedResponses = game.numPlayers() - 1;
    socket.broadcast.emit("BSchance", actionObj);
  };

  function blockableAction(actionObj) {
    console.log("11111111111111");
    responses = [];
    expectedResponses = (actionObj.action === "FOREIGN AID") ? game.numPlayers() - 1 : 1;
    socket.broadcast.emit("blockChance", actionObj); //emit to all (other) players, client is responsible for only reacting if appropriate
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
  };

  var blockables =
  {
    "STEAL": {
      blocked: function (action) {
        console.log("blocked");
        //TODO
      },
      notBlocked: function (action) {
        console.log("not blocked");
        //TODO
      }
    }
    //TODO ASSASSINATE, FOREIGN AID (steal x2?)
  };

  return {
    addResponse,
    allResponsesGathered,
    someResponse,
    moveOn, //TODO export needed?
    performAction, //TODO export needed?
    characterSpecificAction,
    blockableAction,
    askToLoseInfluence,
    BSables,
    blockables
  };
};
