"use strict";

//var _ = require('underscore'); //TODO add to dependencies //TODO uncomment

const ROLES = ["Duke", "Assassin", "Captain", "Ambassador", "Contessa"];
const MAX_PLAYERS = 4; //TODO change to 6
const MIN_PLAYERS = 2;
const STARTING_COINS = 2;
const MUST_COUP_AMOUNT = 10;
const INCOME_BOON = 1;
const FOREIGN_AID_BOON = 2;
const TAX_BOON = 3;
const COUP_COST = 7;
const ASSASSINATION_COST = 3;
const STEAL_AMOUNT = 2;

var Player = function(username, initialCards) {
  this.username = username;
  this.coins = STARTING_COINS;
  this.influence = initialCards.map(x => ({role: x, alive: true}));
};

Player.prototype.acquireCoins = function(num) {
  this.coins += num;
  return num;
};

//returns the number of coins actually lost
Player.prototype.relinquishCoins = function(num) {
  if (this.coins < num) num = this.coins;
  this.coins -= num;
  return num;
};

//pass this function "Duke" to have player lose (one of) their Duke(s)
Player.prototype.loseInfluence = function(role) {
  if (!this.influence.some(x => {
    if (x.alive && x.role === role) {
      x.alive = false;
      return true;
    }
  })) throw "Player does not have specified role!"
  return this;
};

Player.prototype.isOut = function() {
  return !this.influence.some(x => x.alive);
};

Player.prototype.hasRole = function(role) {
  return this.influence.some(x => x.role === role);
}

//TODO make sure all functions check if game is started

var Game = function() {
  this.isStarted = false;
  this.isOver = false;
  this.currentTurn = 0;
  this.players = [];
  this.deck = _.shuffle([...ROLES, ...ROLES, ...ROLES]);
};

Game.prototype.addPlayer = function(username) {
  if (this.isStarted) throw "game already started!";
  if (!username) throw "no username given!";
  if (this.players.some(x => x.username === username)) throw "username already taken!";
  if (this.players.length >= MAX_PLAYERS) throw "Max players in game already!"

  this.players.push(new Player(username, this.drawFromCourtDeck(2)));
};

Game.prototype.drawFromCourtDeck = function(num) {
  var dealt = [];
  for(let i = 0; i < num; i++) {
    dealt.push(this.deck.pop());
  }
  return dealt;
};

Game.prototype.currentPlayer = function() {
  return this.players[this.currentTurn % this.players.length];
};

Game.prototype.nextPlayer = function() {
  var next = null;
  do {
    next = this.players[++this.currentTurn % this.players.length];
  } while(next.isOut());
  return next;
};

Game.prototype.getPlayer = function(username) {
  var filtered = this.players.filter(x => x.username === username);
  if (filtered.length === 0) throw "No player with that username!";
  return filtered[0];
}

Game.prototype.startGame = function() {
  if (this.isStarted) throw "Game already started!";
  if (this.isOver) throw "Can't restart game!"; //TODO ditch isOver and allow game restart
  if (this.players < MIN_PLAYERS) throw "Not enough players in game yet!";

  this.isStarted = true;
  return this.currentPlayer();
};

//will return winning player and end the game if able, otherwise returns null
Game.prototype.getWinner = function() {
  var remainingPlayers = this.players.filter(x => !x.isOut());
  if (remainingPlayers.length === 1) {
    this.isStarted = false;
    this.isOver = true;
    return remainingPlayers[0];
  } else {
    return null;
  }
};

//This file does not handle managing BS calls and block opportunities.
//So a steal action should only be passed into here after it is sure it will happen
//App will be responsible for making couped player lose an influence before moving on
//  and such before moving on by calling game.nextPlayer()
//actionObj should have keys "player", "action", and "targetPlayer" if applicable
// player is the string player username
// action is a string all caps like "TAX" or "FOREIGN AID"
// targetPlayer is also a string username
Game.prototype.takeAction = function(actionObj) {
  if (this.currentPlayer().username != actionObj.player) throw "Not your turn!";
  if (this.currentPlayer().coins >= MUST_COUP_AMOUNT && actionObj.action != "COUP") throw "You must coup with that many coins!";
  if (this.targetPlayer && (actionObj.targetPlayer === actionObj.player || this.getPlayer(actionObj.targetPlayer).isOut)) throw "Invalid action target!";

  switch(actionObj.action) {
    case "INCOME":
      this.currentPlayer().acquireCoins(INCOME_BOON);
      break;
    case "FOREIGN AID":
      this.currentPlayer().acquireCoins(FOREIGN_AID_BOON);
      break;
    case "COUP":
      if (this.currentPlayer().coins < COUP_COST) throw "Not enough coins to coup!"
      this.currentPlayer().relinquishCoins(COUP_COST);
      break;
    case "TAX":
      this.currentPlayer().acquireCoins(TAX_BOON);
      break;
    case "ASSASSINATE":
      if (this.currentPlayer().coins < ASSASSINATION_COST) throw "Not enough coins to coup!"
      this.currentPlayer().relinquishCoins(ASSASSINATION_COST);
      break;
    case "STEAL":
      this.currentPlayer().acquireCoins(this.getPlayer(actionObj.targetPlayer).relinquishCoins(STEAL_AMOUNT));
      break;
    case "EXCHANGE":
      //TODO needs to draw 2 cards and return them somehow
      break;
    default:
      throw "Not a valid action!"
  }
};

//call with a username and a role name. If user has that role the shuffle it in and get a new card
Game.prototype.returnAndReplace = function(username, role) {
  var thePlayer = this.getPlayer(username);
  if (!ROLES.includes(role)) throw "Not a valid role!";
  if (!thePlayer.influence.some((x, i) => {
    if (x.alive && x.role === role) {
      thePlayer.influence.splice(i,1);
      return true;
    }
  })) throw "Player does not have specified role!";

  this.deck.push(role);
  this.deck = _.shuffle(this.deck);
  thePlayer.influence.push({role: this.drawFromCourtDeck(1)[0], alive: true}); //TODO shuffle player influence
  return thePlayer; //TODO return player?
};

Game.prototype.numPlayers = function() {
  return this.players.length;
};

//returns challenge loser AND reshuffles the card if it was revealed
Game.prototype.whoLostChallenge = function(caller, claimer, claimedCharacter) {
  var loser = this.getPlayer(claimer).hasRole(claimedCharacter) ? caller : claimer;
  if (loser === caller) {
    this.returnAndReplace(claimer, claimedCharacter); //return the revealed card
  }
  return loser;
};

Game.prototype.getPlayerPerspective = function(viewer) {
  return this.players.map(player => {
    //function that takes a player and returns a player with hidden alive cards
    var copy = Object.assign({}, player);
    if (copy.username !== viewer) {
      copy.influence = copy.influence.map(card => {
        var cardCopy = Object.assign({}, card);
        if (cardCopy.alive) {
          cardCopy.role = "Facedown";
        }
        return cardCopy;
      });
    }
    return copy;
  });
}

//TODO EXCHANGE
//TODO and refactor other code to use hasRole


// module.exports = Game; //TODO uncomment
