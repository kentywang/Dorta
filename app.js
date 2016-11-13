var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
var _ = require("underscore");

const path = require('path');
var io = require('socket.io').listen(server);
var engine = require('./js/engine.js');
var Game = require('./js/Game.js').Game

var shouldBroadcast = true;
var games = { };
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var port = process.env.PORT || 8000;


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use("/js", express.static(__dirname + "/js"));
app.use("/audio", express.static(__dirname + "/audio"));
app.use("/css", express.static(__dirname + "/css"));
app.use("/img", express.static(__dirname + "/img"));

app.get('/', function(req, res) { res.render('index'); });

app.post('/join', function(req, res) {
	console.log(req.body)
  var room = req.body.room;
  if(!room) room = "public";
  res.redirect("/game/" + room);
});

app.get("/game/:id", function(req, res) {
  getGame(req.params.id);
  //res.render('game'); // will need to define game.js
});

server.listen(process.env.PORT || 8000);

// sockets
function setBroadcast(game) { game.shouldBroadcast = true; }

function broadcast(game) {
  if(!game.shouldBroadcast) return;

  emit(game.id, 'gamestate', {
    // frame: engine.frame(),
    // players: engine.players(game),
  });

  game.shouldBroadcast = false;
}

function emit(gameId, message, args) {
  var game = getGame(gameId);
  _.each(game.sockets, function(socket) {
    socket.emit(message, args);
  });
}

function getGame(gameId) {
  if(!games[gameId]) {
    games[gameId] = new Game(gameId);
    games[gameId].shouldBroadcast = true;
  }

  return games[gameId];
}

// inputs
function input(direction, gameId, playerId, playerName) {
  var game = getGame(gameId);
  engine[direction](game, playerId, playerName);
  setBroadcast(game);
}

io.sockets.on('connection', function(socket) {

	console.log("A user has connected")

  socket.on('joinGame', function(data) {
    var game = getGame(data.gameId);
    socket.game = game;
    game.sockets.push(socket);
    setBroadcast(game);
  });

  socket.on('disconnect', function() {
    if(!socket.game) return;

    socket.game.sockets = _.without(socket.game.sockets, socket);
  });

  // checking if xist rooms
 	setInterval(()=>console.log(games), 10000)

  socket.on('up', function(data) {
  	io.emit("gameState", {player1 : 20})
  	console.log("emitted")
    //input('up', data.gameId, data.playerId, data.playerName);
  });

  socket.on('down', function(data) {
    input('down', data.gameId, data.playerId, data.playerName);
  });

  socket.on('left', function(data) {
    input('left', data.gameId, data.playerId, data.playerName);
  });

  socket.on('right', function(data) {
    input('right', data.gameId, data.playerId, data.playerName);
  });

  socket.on('jump', function(data) {
    input('jump', data.gameId, data.playerId, data.playerName);
  });

  socket.on('basic', function(data) {
    input('jump', data.gameId, data.playerId, data.playerName);
  });

  socket.on('super', function(data) {
    input('jump', data.gameId, data.playerId, data.playerName);
  });

  // will probably need to do the key combinations too

  // socket.on('sendchat', function(data) {
  //   emit(data.session.gameId, 'receivechat', {
  //     name: data.session.playerName,
  //     message: data.message
  //   });
  // });
});

// //var framesPerSecondInMilliseconds = 1000.0 / engine.fps;
// var syncRate = 0;

// setInterval(function() {
//   syncRate += 1;

//   for(var key in games) {
//     var game = games[key];
//     var botAdded = bot.add(game);
//     var actionMade = bot.tick(game);
//     var tickResult = engine.tick(game);
//     var occasionallySync = (syncRate % 300) == 0;

//     if(occasionallySync) syncRate = 0;

//     if(actionMade ||
//        botAdded ||
//        tickResult.deathsOccurred ||
//        occasionallySync) {
//       setBroadcast(game);
//     }

//     broadcast(game);

//     //processAchievements(game, tickResult);
//   }
// }, framesPerSecondInMilliseconds);
