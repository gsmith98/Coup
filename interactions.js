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
    expectedResponses = game.numPlayers() - 1;
    socket.broadcast.emit("BSchance", actionObj); //TODO need to emit also? and have client check if it's you?
  };

  function blockableAction(actionObj) {
    console.log("blockableAction");
    responses = [];
    expectedResponses = (actionObj.action === "FOREIGN AID") ? game.numPlayers() - 1 : 1;
    socket.emit("blockChance", actionObj);
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
        blockableAction(action)
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
    }
    //TODO EXCHANGE, ASSASSINATE, BLOCK ASSASSINATE,
  };

  //TODO are all the objects in here gonna be identical? ditch?
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
      blocked: function (action) { //client will respond to block with changed action type: "BLOCK STEAL CAPTAIN"
        console.log("blocked");
        characterSpecificAction(action); //TODO make this anonymous function just characterSpecificAction
      },
      notBlocked: function (action) {
        console.log("not blocked");
        performAction(action); //TODO make this anonymous function just performAction
      }
    }
    //TODO ASSASSINATE
  };

  return {
    addResponse,
    allResponsesGathered,
    someResponse,
    updateClients,
    moveOn, //TODO export needed?
    performAction, //TODO export needed?
    characterSpecificAction,
    blockableAction,
    askToLoseInfluence,
    BSables,
    blockables
  };
};
