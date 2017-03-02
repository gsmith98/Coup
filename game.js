"use strict";

//var _ = require('underscore'); //TODO add to dependencies //TODO uncomment

const ROLES = ["Duke", "Assassin", "Captain", "Ambassador", "Contessa"];
const MAX_PLAYERS = 4; //TODO change to 6
const MIN_PLAYERS = 2;
const STARTING_COINS = 2;
const MUST_COUP_AMOUNT = 10;
const INCOME_BOON = 1;
const FOREIGN_AID_BOON = 2;
const COUP_COST = 7;

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
Game.prototype.takeAction = function(actionObj) {
  if (this.currentPlayer().username != actionObj.player) throw "Not your turn!";
  if(this.currentPlayer().coins >= MUST_COUP_AMOUNT && actionObj.action != "COUP") throw "You must coup with that many coins!"

  switch(actionObj.action) {
    case "INCOME":
      this.currentPlayer().acquireCoins(INCOME_BOON);
      break;
    case "FOREIGN AID":
      this.currentPlayer().acquireCoins(FOREIGN_AID_BOON);
      break;
    case "COUP": //TODO the app will be responsible for making couped player lose an influence before moving on
      if (this.currentPlayer().coins < COUP_COST) throw "Not enough coins to coup!"
      this.currentPlayer().relinquishCoins(COUP_COST);
      break;
    default:
      throw "Not a valid action!"
  }
}

module.exports = Game;
