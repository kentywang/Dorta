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

// app.post('/join', function(req, res) {
// 	//console.log(req.body)
//   var room = req.body.room;
//   if(!room) room = "public";
//   res.redirect("/game/" + room);
// });

app.get("/game/:id", function(req, res) {
  getGame(req.params.id);
  //res.render('game'); // will need to define game.js
});

server.listen(process.env.PORT || 8000);

// sockets
function setBroadcast(game) { game.shouldBroadcast = true; }

function broadcast() {
 // if(!game.shouldBroadcast) return;
 //console.log(engine["gameState"])
  io.emit('gameState', engine["gameState"])
    // frame: engine.frame(),
    // players: engine.players(game),
  //);

  //game.shouldBroadcast = false;
}

// inputs
function input(action, pressedKeys, playerNo, dt) {
	console.log(action, pressedKeys,playerNo)
  engine[action](pressedKeys, playerNo, dt);
}
var p1, p2;

io.sockets.on('connection', function(socket) {

	console.log("A user has connected")

  socket.on('joinGame', function(data) {
  	if(!p1){p1 = socket.id;}
  	console.log(p1)
  	if(!p2){p2 = socket.id;}
  });

  socket.on('disconnect', function() {
    //if(!socket.game) return;
    if(socket.id === p1){ p1 = 0};
    if(socket.id === p2){ p2 = 0};
    //socket.game.sockets = _.without(socket.game.sockets, socket);
  });


  socket.on('handleInput', function(pressedKeys, dt) {
  	if(socket.id === p1){
  	  input('handleInput', pressedKeys, 1, dt);
  	}
  	else if(socket.id === p2){
  	  input('handleInput', pressedKeys, 2, dt);
  }})
});

var framesPerSecondInMilliseconds = 1000.0 / 60;
var syncRate = 0;

setInterval(function() {
  syncRate += 1;

 // for(var key in games) {
    //var game = engine[key];
    // var botAdded = bot.add(game);
    // var actionMade = bot.tick(game);
    // var tickResult = engine.tick(game);
    // var occasionallySync = (syncRate % 300) == 0;

    // if(occasionallySync) syncRate = 0;

    // if(actionMade ||
    //    botAdded ||
    //    tickResult.deathsOccurred ||
    //    occasionallySync) {
    //   setBroadcast(game);
    // }
    broadcast();

    //processAchievements(game, tickResult);
  //}
}, framesPerSecondInMilliseconds);
