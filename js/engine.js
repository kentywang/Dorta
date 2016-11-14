//var Game = require('./js/Game.js').Game
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

function Sprite(url, pos, size, boxpos, boxsize, speed, frames, dir, once, state) {
    this.state;
    this.flipped = false;
    this.priority = 0;  // this prop determines which attack has precedence
    this.pos = pos;
    this.size = size;
    this.boxpos = boxpos;
    this.boxsize = boxsize;
    this.speed = typeof speed === 'number' ? speed : 0;
    this.frames = frames;
    this._index = 0;
    this.url = url;
    this.dir = dir || 'horizontal';
    this.once = once;
};

Sprite.prototype.update = function(dt) {
     switch(this.state){
        case ("moving"):
            this.pos = [64 * 4, 0];
            this.priority = 8;
            this.frames = [0, 1, 2, 3];
            break;
        case ("hit"):
            this.pos = [64 * 4, 64 * 2];
            this.priority = 0;
            this.speed = 10;
            this.frames = [0, 1, 2];
            this.once = true;
            break;
        default:
            this.state = "moving";
            this.pos = [64 * 4, 0];
            this.priority = 8;
            this.frames = [0, 1, 2, 3];
    }

    this._index += this.speed*dt;
}

Sprite.prototype.render = function(ctx) {
    var frame;

    if(this.speed > 0) {
        var max = this.frames.length;
        var idx = Math.floor(this._index);
        frame = this.frames[idx % max];

        if(this.once && idx >= max) {
            this.done = true;
            return;
        }
        if(idx >= max) {    // these are the actions that cannot be interrupted once begun and reset to idle after completion
            if(this.state === "hit"){
                return;
            }
            this._index = 0;
        }
    }
    else {
        frame = 0;
    }


    var x = this.pos[0];
    var y = this.pos[1];
    if(this.dir == 'vertical') {
        y += frame * this.size[1];
    }
    else {
        x += frame * this.size[0];
    }
    // if(this.flipped){
    //     ctx.scale(-1, 1);
    //     ctx.drawImage(resources.get(this.url),
    //               x, y,
    //               this.size[0], this.size[1],
    //               0, 0,
    //               -this.size[0], this.size[1]);
    //     ctx.restore();
    // }
    // else{
    //     ctx.drawImage(resources.get(this.url),
    //               x, y,
    //               this.size[0], this.size[1],
    //               0, 0,
    //               this.size[0], this.size[1]);
    // }
}

function HitSprite(url, pos, size, boxpos, boxsize, speed, frames, dir, once, state) {
    this.state;
    this.flipped = false;
    this.priority = 0;  // this prop determines which attack has precedence
    this.pos = pos;
    this.size = size;
    this.boxpos = boxpos;
    this.boxsize = boxsize;
    this.speed = 30;
    this.frames = frames;
    this._index = 0;
    this.url = url;
    this.dir = dir || 'horizontal';
    this.once = once;
};

HitSprite.prototype.update = function(dt) {
     switch(this.state){
        case ("dmg"):
            this.pos = [32 * 5, 0];
            this.frames = [0,1];
            this.once = true;
            break;
        default:
            this.state = "dmg";
            this.pos = [32 * 5, 0];
            this.frames = [0,1];
            this.once = true;
    }

    this._index += this.speed*dt;
}

HitSprite.prototype.render = function(ctx) {
    var frame;

    if(this.speed > 0) {
        var max = this.frames.length;
        var idx = Math.floor(this._index);
        frame = this.frames[idx % max];

        if(this.once && idx >= max) {
            this.done = true;
            return;
        }
        if(idx >= max) {    // these are the actions that cannot be interrupted once begun and reset to idle after completion
            if(this.state === "hit"){
                return;
            }
            this._index = 0;
        }
    }
    else {
        frame = 0;
    }


    var x = this.pos[0];
    var y = this.pos[1];
    if(this.dir == 'vertical') {
        y += frame * this.size[1];
    }
    else {
        x += frame * this.size[0];
    }
    // if(this.flipped){
    //     ctx.scale(-1, 1);
    //     ctx.drawImage(resources.get(this.url),
    //               x, y,
    //               this.size[0], this.size[1],
    //               0, 0,
    //               -this.size[0], this.size[1]);
    //     ctx.restore();
    // }
    // else{
    //     ctx.drawImage(resources.get(this.url),
    //               x, y,
    //               this.size[0], this.size[1],
    //               0, 0,
    //               this.size[0], this.size[1]);
    // }
}


function PlayerSprite(url, pos, size, boxpos, boxsize, speed, frames, color, dir, once, state) {
    this.state;

    this.priority = 0;  // this prop determines which attack has precedence
    this.pos = pos;
    this.color = color;
    this.size = size;
    this.boxpos = boxpos;
    this.boxsize = boxsize;
    this.speed = typeof speed === 'number' ? speed : 0;
    this.frames = frames;
    this._index = 0;
    this.url = url;
    this.dir = dir || 'horizontal';
    this.once = once;
    this.resetFrame = false;    // do I even need this?
};

PlayerSprite.prototype.update = function(dt) {
	//console.log("in update of srpite", this.state)
    switch(this.state){
        case "downkick":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*3];
            this.frames = [8];
            this.priority = 10;
            break;
        case "crouch":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*7];
            this.frames = [2];
            this.priority = 7;
            break;
        case "punch":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*11]; 
            this.frames = [2, 3, 2, 3, 2, 3]
            this.speed *= 2.2; 
            this.priority = 9;
            break;
        case "uppercut":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*8];
            this.frames = [6, 7, 6, 7, 6];
            this.priority = 6;
            break;
        case "airkick":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*7];
            this.frames = [5, 6];
            this.priority = 5;
            break;
        case "sidekick":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*10];
            this.frames = [2, 3];
            this.priority = 4;
            break;
        // case "idle":                 // this makes players walk in place for some reason
        //     this.url = `img/cat${this.color}.png`;
        //     this.state = "idle";
        //     this.pos = [0, 0];
        //     this.frames = [0, 1, 2, 3];
        //     this.priority = 1;
        case "walk":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64];
            this.frames = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
            this.priority = -1;
            break;
        case "supershot":
            this.url = `img/cat2${this.color}.png`
            this.pos = [0, 64*0];
            this.frames = [0, 1, 2, 3, 4, 5, 6, 7, 8]  //  , 9, 10];
            this.speed *= 1.5;
            this.priority = -1; // this isn't the attack itself, remember
            break;
        case "jump":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*2];
            this.frames = [2, 3];
            this.priority = -2;
            break;
        case "jump2":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*3];
            this.frames = [3, 4, 5, 6];
            this.speed *= 1.5;
            this.priority = -2;
            break;
        case "tp":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*3];
            this.frames = [1];
            this.priority = -2;
            break;
        case "hurt":
            this.url = `img/cat${this.color}.png`
            this.pos = [0, 64*4];
            this.frames = [1, 2]
            this.speed *= 0.25;
            this.priority = -3;
            break;
        case "dead":
            this.url = `img/cat${this.color}.png`;
            this.pos = [0, 64*4];
            this.frames = [4];
            this.priority = -4;
            break;
        default:
            this.url = `img/cat${this.color}.png`;
            this.state = "idle";
            this.pos = [0, 0];
            this.frames = [0, 1, 2, 3];
            this.priority = 0;
    }
    this._index += this.speed*dt;
}

PlayerSprite.prototype.render = function(ctx) {
    var frame;

    if(this.speed > 0) {
        var max = this.frames.length;
        var idx = Math.floor(this._index);
        frame = this.frames[idx % max];

        if(this.once && idx >= max) {
            this.done = true;
            return;
        }
        if(idx >= max) {    // these are the actions that cannot be interrupted once begun and reset to idle after completion
            if(this.state === "supershot" || this.state === "tp" || this.state === "crouch" || this.state === "punch"){
                this.state = "idle";
            }
            this._index = 0;
        }
    }
    else {
        frame = 0;
    }


    var x = this.pos[0];
    var y = this.pos[1];

    if(this.dir == 'vertical') {
        y += frame * this.size[1];
    }
    else {
        x += frame * this.size[0];
    }
    // if(this.flipped){
    //     ctx.save();
    //     ctx.scale(-1, 1);
    //     ctx.drawImage(resources.get(this.url),
    //               x, y,
    //               this.size[0], this.size[1],
    //               0, 0,
    //               -this.size[0], this.size[1]);
    //     ctx.restore();
    // }else{
    //     ctx.drawImage(resources.get(this.url),
    //               x, y,
    //               this.size[0], this.size[1],
    //               0, 0,
    //               this.size[0], this.size[1]);
    // }
}


// Speed in pixels per second
var playerSpeed = 70;
var normalSpeed = 6;    // frames per second of sprite
var shotSpeed = 160;
var invulnerableTime = 800;
var regenAmt = .5;
var maxHealth = 115;
var startCapacity = 380;

// Cooldowns
var supershotCd = 2 * 1000;
var jumpCd = .25 * 1000;
var punchCd = .8 * 1000;
var tpCd = 2 * 1000;
var uppercutCd = 1.4 * 1000;
var shotChargeTime = .5 * 1000;

// Physics
var playerJump = 300;
var gravityAccelerationY = 800;
var gravityAccelerationX = 20;
var groundHeight = 5;
var bounceCapacity= 100;
var bounceCapacity2= 300;
var groundBounceVelocity = 450;

var shakeCd = 1 * 1000;
var shakeDuration = 200;
var shakeUntil = 0;

var canvas = {
width: 272,
height: 160
}

// The main game loop
var lastTime;
var framesToSkip = 0;
var disableControls = false;
var endFrameSkipDuration = 1000;
var midPt;
var slowMidPt = 5;
var whoLostLast = 0;
var drawNow = false;

// Game state
var player1 = {
    who: 1,
    health: maxHealth,
    capacity: startCapacity,
    pos: [0, 0],
    velocityY: 0,
    velocityX: 0,
    sprite: new PlayerSprite('img/cat.png', [0, 0], [64, 64], [25, 26], [12, 28], normalSpeed, [0, 1, 2, 3],"Green"),
    lastJump: Date.now(),
    lastLand: Date.now(),
    lastKick: Date.now(),
    lastPunch: Date.now(),
    direction: 'RIGHT',
    shots: [],
    keys: {
        UP: "UP",
        DOWN: "DOWN",
        LEFT: "LEFT",
        RIGHT: "RIGHT",
        JUMP: "SPACE",
        BASIC: "Q",
        SPECIAL: "W",
        ULTI: "F"
    },
    damaged: dmg,
    invulnerable: Date.now(),
    lastRegen: Date.now(),
    //lastStableHp: maxHealth,
    lastStableCp: 0,
    lastTp: Date.now(),
    lastUppercut: Date.now()
};

var player2 = {
    who: 2,
    health: maxHealth,
    capacity: startCapacity,
    pos: [0, 0],
    velocityY: 0,
    velocityX: 0,
    sprite: new PlayerSprite('img/cat.png', [0, 0], [64, 64], [25, 26], [12, 28], normalSpeed, [0, 1, 2, 3], "Purple"),
    lastJump: Date.now(),
    lastLand: Date.now(),
    lastKick: Date.now(),
    lastPunch: Date.now(),
    direction: 'LEFT',
    shots: [],
    keys: {
        UP: "U",
        DOWN: "E",
        LEFT: "N",
        RIGHT: "I",
        JUMP: "C",
        BASIC: "1",
        SPECIAL: "2",
        ULTI: "3"
    },
    damaged: dmg,
    invulnerable: Date.now(),
    lastRegen: Date.now(),
    //lastStableHp: maxHealth,
    lastStableCp: 0,
    lastTp: Date.now(),
    lastUppercut: Date.now()
};

var players = [player1, player2];
var explosions = [];

var gameState = "play";
var gameStateSet = 0;
var gameTime = 0;
var isGameOver;

var x = 0;
function main() {
// console.log(x++)
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;


    //console.log(player1.velocityX)
    // if(gameState === "menu"){
    //     animatedScreen(now);
    // }
    // else{
    //     if(shakeUntil > Date.now()){
    //         preShake();
    //     }

        if(framesToSkip === 0){
            update(dt);
            render();
        }
        if(framesToSkip > 0){
        // // skip a frame if hit was registered in either player's .damage method
            framesToSkip--;
        }
        //exports.bringIntoGame = bringIntoGame;
		// exports.handleInput = handleInput;
		// exports.gameState = {player2}
        // postShake();
        lastTime = now;
    exports.gameState = {lastTime,
		framesToSkip,
		disableControls,
		endFrameSkipDuration,
		midPt,
		slowMidPt,
		whoLostLast,
		drawNow,
		player1,
		player2,
		players,
		explosions,
		gameState,
		gameStateSet,
		gameTime,
		isGameOver,
		shakeUntil}


};




// initialization
(function init() {
    reset(false);
    lastTime = Date.now();
    setInterval(main, 1000 / 60)
})();



// Utility functions
function numberBetween(n, m){
    return Math.ceil(Math.random() * (m - n) + n);
}
// Shake, shake, shake
function preShake() {
  ctx.save();
  var dx = Math.random()*3;
  var dy = Math.random()*3;
  ctx.rotate(((Math.random() - 0.5)*2)* Math.PI/180);
  ctx.translate(dx, dy);  
}
function postShake() {
  ctx.restore();
}
function midPlayer(player1, player2, flair){  

    // add variation to height if flair
    var vary = 0; 
    if(flair === "up"){
        vary = -Math.random();
    } 
    if(flair === "down"){
        vary = Math.random();
    }

    // once you find your center
   return [(((player1.pos[0] + player1.sprite.boxpos[0] + player1.pos[0] + player1.sprite.boxpos[0] + player1.sprite.boxsize[0])/2) + ((player2.pos[0] + player2.sprite.boxpos[0] + player2.pos[0] + player2.sprite.boxpos[0] + player2.sprite.boxsize[0])/2))/2 - 16 + vary,
    (((player1.pos[1] + player1.sprite.boxpos[1] + player1.pos[1] + player1.sprite.boxpos[1] + player1.sprite.boxsize[1])/2) + ((player2.pos[1] + player2.sprite.boxpos[1] + player2.pos[1] + player2.sprite.boxpos[1] + player2.sprite.boxsize[1])/2))/2 -16 + vary]; // -16 to account for sprite size of 32X32
    // you are sure to win ~
};

// Damage mechanics (using arrow function to preserve "this" context)
function dmg(player){
    var pushback = (pts, whereTo) => {
        if(pts){    // ensure crouch doesn't do dmg
            this.health -= pts;
            this.capacity += pts * 1.8;
        }
        if(this.capacity < bounceCapacity2){
            switch(whereTo){
            case("sideUp"):
                this.velocityY = -this.capacity/4;

                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/6;
                }else{
                    this.velocityX = this.capacity/6;
                }
                break;
            case("down"):
                this.velocityY = this.capacity;

                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/4;
                }else{
                    this.velocityX = this.capacity/4;
                }
                break;
            case("sideDown"):
                this.velocityY = this.capacity/4;

                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/2;
                }else{
                    this.velocityX = this.capacity/2;
                }
                break;
            default:
                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/2;
                }else{
                    this.velocityX = this.capacity/2;
                }
            }
        }else{
            switch(whereTo){
            case("sideUp"):
                this.velocityY = -this.capacity/2;

                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/4;
                }else{
                    this.velocityX = this.capacity/4;
                }
                break;
            case("down"):
                this.velocityY = groundBounceVelocity +this.capacity;

                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/4;
                }else{
                    this.velocityX = this.capacity/4;
                }
                break;
            case("sideDown"):
                this.velocityY = Math.max(groundBounceVelocity, this.capacity);

                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/2;
                }else{
                    this.velocityX = this.capacity/2;
                }
                break;
            default:
                this.velocityY = -this.capacity/4
                if(this.direction === "RIGHT"){
                    this.velocityX = -this.capacity/2;
                }else{
                    this.velocityX = this.capacity/2;
                }
            }
        }
        
        framesToSkip = 10;
        this.invulnerable = Date.now();
        this.sprite.state = "hurt";
    }

    switch(player.sprite.state){
        case ("crouch"):
            if(this.direction === "RIGHT"){
                this.velocityX = -playerJump /4;
                player.velocityX = playerJump /4;
            }else{
                this.velocityX = playerJump /4;
                player.velocityX = -playerJump /4;
            }
            framesToSkip = 1;
            break;
        case ("uppercut"):
            pushback(numberBetween(8,10), "sideUp");
            break;
        case ("downkick"):
            pushback(numberBetween(12,18), "down");
            break;
        case ("punch"):
            pushback(numberBetween(11,13));
            break;
        case ("airkick"):
            pushback(numberBetween(12,14));
            break;
        case ("sidekick"):
            pushback(numberBetween(11,17), "sideDown");
            break;
        case ("moving"):
            pushback(player.speed/8);
            player.sprite.state = "hit";
            break;
        default:
            break;
    }
}


// Update game objects
function update(dt) {
    gameTime += dt;

    midPt = (player1.pos[0]+player1.sprite.boxpos[0] + player2.pos[0] + player2.sprite.boxpos[0] + player2.sprite.boxsize[0])/2 - 136;

    if(gameState === "over" && whoLostLast > 0){setTimeout(reset,3000)
    }

    players.forEach(player => {
        if(Date.now() - gameStateSet < 1000){
            framesToSkip = 5
        }

        if(player.health <= 0){
            gameOver(player);
        }

        if(Date.now() - player.lastRegen > 1000 && player.health <= (maxHealth - regenAmt) && player.sprite.state !== "dead"){
            player.health += regenAmt;
            player.lastRegen = Date.now();
        }

        if(player.health <= 0 && player.sprite.state == "dead"){
            player.health = 0;
            player.invulnerable = Date.now();
        }
        // disable hurt state if no longer invulnerable
        else if(player.sprite.state === "hurt" && player.invulnerable < Date.now() - invulnerableTime){
            player.sprite.state = "idle";    
        }
    })


   // if(!disableControls){ handleInput(pressedKeys, playerNo, dt);}
    processPhysics(dt);
    updateEntities(dt);
    checkCollisions(dt);
};

	
function handleInput(pressedKeys, playerNo, dt) {
	if(disableControls){return;}
    //console.log(player2.sprite.state)
	//console.log("in handle input", pressedKeys, playerNo)
	if(playerNo === 1){
 		player = player1;
	}else{
		player = player2;
	}
    	//console.log(player);
    switch(player.sprite.state){
        case("idle"):
            if(pressedKeys['JUMP'] && pressedKeys['LEFT']) {

                player.sprite.state = "jump";
                player.velocityY = -playerJump;
                player.velocityX = -playerJump/4;
                player.lastJump = Date.now();
            }

            else if(pressedKeys['JUMP'] && pressedKeys['RIGHT']) {
                player.sprite.state = "jump";
                player.velocityY = -playerJump;
                player.velocityX = playerJump/4;
                player.lastJump = Date.now();
            }

            else if(pressedKeys['JUMP']) {
            	//console.log("humg!")
                player.sprite.state = "jump";
                player.velocityY = -playerJump;
                player.lastJump = Date.now();
            }

            else if(pressedKeys['BASIC'] && pressedKeys['UP']) {
                if(Date.now() - player.lastUppercut < uppercutCd){ break;}
                player.sprite.state = "uppercut";
                player.velocityY = -playerJump /1.2;

                if(player.direction === "RIGHT"){
                    player.velocityX = playerJump /5;
                }
                else{   
                    player.velocityX = -playerJump /5;
                }
                player.lastUppercut = Date.now();
                player.lastJump = Date.now();
            }
            
            else if(pressedKeys['BASIC']) {
                if(Date.now() - player.lastPunch > punchCd){ 
                        player.sprite.state = "punch";
                        player.lastPunch = Date.now();
                        }
            }

            else if(pressedKeys['SPECIAL'] && pressedKeys[player.direction]){
                if(Date.now() - player.lastTp < tpCd){ break;}
                player.sprite.state = "tp";

                if(player.who === 1){
                    if(player.direction === "RIGHT"){
                        player.pos[0] = player2.pos[0] - 60;
                        player.velocityX += 300;
                    }
                    else{
                        player.pos[0] = player2.pos[0] + 60;
                        player.velocityX -= 300;
                    }                
                }
                else{
                    if(player.direction === "RIGHT"){
                        player.pos[0] = player1.pos[0] - 60;
                        player.velocityX += 300;
                    }
                    else{
                        player.pos[0] = player1.pos[0] + 60;
                        player.velocityX -= 300;
                    }                
                }

                framesToSkip = 10;
                player.lastTp = Date.now();
            }

            // else if(pressedKeys['SPECIAL']) {
            //     //  break if last shot in array isn't past cooldown timing
            //     if(player.shots.length && Date.now() - player.shots[player.shots.length - 1].fireTime < supershotCd){ 
            //         break;}

            //     player.sprite.state = "supershot";

            //     var x = player.pos[0] + player.sprite.boxsize[0] / 4;
            //     var y = player.pos[1] + player.sprite.boxsize[1] / 8;
            //     player.shots.push({ pos: [x, y],
            //            direction: player.direction,
            //            sprite: new Sprite('img/shot.png', [64 * 4, 0], [64, 64], [22, 13], [24, 38], normalSpeed * 1.5, [0, 1, 2, 3]),
            //            fireTime: Date.now(),
            //            speed: shotSpeed
            //        });
            // }
            
            else if(pressedKeys['LEFT']) {
                player.sprite.state = "walk";
                player.pos[0] -= playerSpeed * dt;  
            }

            else if(pressedKeys['RIGHT']) {
                player.sprite.state = "walk";
                player.pos[0] += playerSpeed * dt;
            }

            else if(pressedKeys['DOWN']) {
                player.sprite.state = "crouch";
            }
            break;

        case("jump"):   // these are midair actions
            if(pressedKeys['JUMP'] && pressedKeys['LEFT']) {
                if(player.velocityX <= 0){
                    player.velocityX -= playerJump /4 * dt;
                }
                else if(player.velocityX > 0){
                    player.velocityX -= playerJump /8 * dt;
                }

                if(Date.now() - player.lastJump > jumpCd){
                    player.sprite.state = "jump2";
                    player.velocityY = -playerJump /1.2;
                    if(player.velocityX > 0){
                        player.velocityX = -playerJump/4;
                    }
                    player.lastJump = Date.now();
                }
            }

            else if(pressedKeys['JUMP'] && pressedKeys['RIGHT']) {
                if(player.velocityX < 0){
                    player.velocityX += playerJump /8 * dt;
                }
                else if(player.velocityX >= 0){
                    player.velocityX += playerJump /4 * dt;
                }

                if(Date.now() - player.lastJump > jumpCd){
                    player.sprite.state = "jump2";
                    player.velocityY = -playerJump /1.2;
                    if(player.velocityX < 0){
                        player.velocityX = playerJump/4;
                    }
                    player.lastJump = Date.now();
                }
            }

            else if(pressedKeys['JUMP']){
                if(Date.now() - player.lastJump > jumpCd){
                    player.sprite.state = "jump2";
                    player.velocityY = -playerJump /1.2;
                    player.lastJump = Date.now();
                }
            }

            else if(pressedKeys['BASIC'] && (pressedKeys['LEFT'] || pressedKeys['RIGHT'])) {
                player.sprite.state = "sidekick";
                
                if(player.direction === "RIGHT"){
                    player.velocityX = playerJump /2;
                }
                else{   
                    player.velocityX = -playerJump /2;
                }

                player.velocityY = playerJump /3;
            }

            else if(pressedKeys['BASIC'] && pressedKeys['DOWN']) {
                    player.sprite.state = "downkick";
                    player.velocityX = 0;
                    player.velocityY = playerJump /1.5;
            }

            else if(pressedKeys['BASIC'] && pressedKeys['UP']) {
                if(Date.now() - player.lastUppercut < uppercutCd){ break;}
                player.sprite.state = "uppercut";
                player.velocityY = -playerJump /1.2;

                if(player.direction === "RIGHT"){
                    player.velocityX = playerJump /5;
                }
                else{   
                    player.velocityX = -playerJump /5;
                }
                player.lastUppercut = Date.now();
                player.lastJump = Date.now();
            }

            else if(pressedKeys['BASIC']) {
                    player.sprite.state = "airkick";
            }

            else if(pressedKeys['LEFT']) {
                if(player.velocityX <= 0){
                    player.velocityX -= playerJump /4 * dt;
                }
                else if(player.velocityX > 0){
                    player.velocityX -= playerJump /8 * dt;
                }
            }

            else if(pressedKeys['RIGHT']) {
                if(player.velocityX < 0){
                    player.velocityX += playerJump /8 * dt;
                }
                else if(player.velocityX >= 0){
                    player.velocityX += playerJump /4 * dt;
                }
            }
            break;
        case("jump2"):   // these are midair actions
            if(pressedKeys['BASIC'] && pressedKeys['UP']) {
                if(Date.now() - player.lastUppercut < uppercutCd){ 
                    break;}
                player.sprite.state = "uppercut";
                player.velocityY = -playerJump /1.2;

                if(player.direction === "RIGHT"){
                    player.velocityX = playerJump /5;
                }
                else{   
                    player.velocityX = -playerJump /5;
                }
                player.lastUppercut = Date.now();
                player.lastJump = Date.now();
            }
            else if(pressedKeys['JUMP'] && pressedKeys['LEFT']) {
                if(player.velocityX <= 0){
                    player.velocityX -= playerJump /4 * dt;
                }
                else if(player.velocityX > 0){
                    player.velocityX -= playerJump /8 * dt;
                }
            }
            else if(pressedKeys['JUMP'] && pressedKeys['RIGHT']) {
                if(player.velocityX < 0){
                    player.velocityX += playerJump /8 * dt;
                }
                else if(player.velocityX >= 0){
                    player.velocityX += playerJump /4 * dt;
                }
            }

            else if(pressedKeys['BASIC'] && (pressedKeys['LEFT'] || pressedKeys['RIGHT'])) {
                player.sprite.state = "sidekick";
                
                if(player.direction === "RIGHT"){
                    player.velocityX = playerJump /2;
                }
                else{   
                    player.velocityX = -playerJump /2;
                }

                player.velocityY = playerJump /3;
            }

            else if(pressedKeys['BASIC'] && pressedKeys['DOWN']) {
                    player.sprite.state = "downkick";
                    player.velocityX = 0;
                    player.velocityY = playerJump /1.5;
            }


            else if(pressedKeys['BASIC']) {
                    player.sprite.state = "airkick";
            }

            else if(pressedKeys['LEFT']) {
                if(player.velocityX <= 0){
                    player.velocityX -= playerJump /4 * dt;
                }
                else if(player.velocityX > 0){
                    player.velocityX -= playerJump /8 * dt;
                }
            }

            else if(pressedKeys['RIGHT']) {
                if(player.velocityX < 0){
                    player.velocityX += playerJump /8 * dt;
                }
                else if(player.velocityX >= 0){
                    player.velocityX += playerJump /4 * dt;
                }
            }
            break;
        default:
        //console.log(player.who, player.sprite.state)
            break;
    }
}

function processPhysics(dt){
    players.forEach(player => {
        player.velocityY += gravityAccelerationY * dt;

        if(player.velocityX < 0){
            player.velocityX += gravityAccelerationX * dt;
        }
        if(player.velocityX > 0){
            player.velocityX -= gravityAccelerationX * dt;
        }

        player.pos[1] += player.velocityY * dt;
        player.pos[0] += player.velocityX * dt;
        
    })

}

function updateEntities(dt) {

    players.forEach(player => {
        // Update the player sprite animation
        player.sprite.update(dt);
        //console.log(player.sprite);

       ////Update all the shots
        for(var i=0; i<player.shots.length; i++) {
            //  this will check if enough time has passed before moving shot
            if(Date.now() - player.shots[i].fireTime < shotChargeTime){ 
                if(player.sprite.state === "hurt"){
                    player.shots[i].sprite.done = true;
                }
                break;
            }

            var shot = player.shots[i];

            if(shot.sprite.state === "moving"){           
                switch(shot.direction) {
                    case 'LEFT': shot.pos[0] -= shot.speed * dt; break;
                    case 'RIGHT': shot.pos[0] += shot.speed * dt; break;
                    default:
                        shot.pos[0] = 0;
                }
            }

            // flip shot if direction is left
            if(shot.direction === "LEFT"){
                shot.sprite.flipped = true;
            }else{
                shot.sprite.flipped = false;
            }

            player.shots[i].sprite.update(dt);

            // Remove the shot if it goes offscreen
            if(shot.pos[1] < 0 || shot.pos[1] > canvas.height ||
               shot.pos[0] > canvas.width || shot.pos[0] + shot.sprite.boxsize[0] + shot.sprite.boxpos[0]< 0) {
                player.shots.splice(i, 1);
                i--;
            }

            if(shot.sprite.done) {
                player.shots.splice(i, 1);
                i--;
            }
        }
     })
    
    // update hit effects
    for(var i = 0; i < explosions.length; i++){
        if(explosions[i].direction === "LEFT"){
            explosions[i].sprite.flipped = true;
        }else{
            explosions[i].sprite.flipped = false;
        }

        explosions[i].sprite.update(dt);

        if(explosions[i].sprite.done){
            explosions.splice(i,1);
            i--;
        }

    }

}


// Collisions
function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCollisions(dt) {
    checkPlayerBounds(dt);

    var playerPos = [];
    var playerSize = [];

    players.forEach(player => {
        playerPos.push([player.pos[0] + player.sprite.boxpos[0], player.pos[1] + player.sprite.boxpos[1]]);
        playerSize.push(player.sprite.boxsize);
    })

    // both players must be touching AND neither can be invulnerable if damage is to occur
    if(boxCollides(playerPos[0], playerSize[0], playerPos[1], playerSize[1]) && (player1.invulnerable < Date.now() - invulnerableTime && player2.invulnerable < Date.now() - invulnerableTime)) {
        if(player1.sprite.priority > player2.sprite.priority){
            if(player1.sprite.priority > 0){
                explosions.push({ 
                        pos: midPlayer(player1, player2),
                        direction: player1.direction,
                        sprite: new HitSprite('img/shot.png', [32 * 5, 0], [32, 32], [0, 0], [32, 32], normalSpeed, [0, 1], "horizontal", true, "dmg")
                       })
                player2.damaged(player1);
            }
        }else if(player1.sprite.priority < player2.sprite.priority){
            if(player2.sprite.priority > 0){
                explosions.push({ 
                        pos: midPlayer(player1, player2),
                        direction: player2.direction,
                        sprite: new HitSprite('img/shot.png', [32 * 5, 0], [32, 32], [0, 0], [32, 32], normalSpeed, [0, 1], "horizontal", true, "dmg")
                       })
                player1.damaged(player2);
            }
        }else{
            if(player1.sprite.priority > 0){
                explosions.push({ 
                        pos: midPlayer(player1, player2, "up"),
                        direction: player1.direction,
                        sprite: new HitSprite('img/shot.png', [32 * 5, 0], [32, 32], [0, 0], [32, 32], normalSpeed, [0, 1], "horizontal", true, "dmg")
                       })
                explosions.push({ 
                        pos: midPlayer(player1, player2, "down"),
                        direction: player2.direction,
                        sprite: new HitSprite('img/shot.png', [32 * 5, 0], [32, 32], [0, 0], [32, 32], normalSpeed, [0, 1], "horizontal", true, "dmg")
                       })
                player2.damaged(player1);
                player1.damaged(player2);
            }
        } 
    }
    
    // Run collision detection for all players and shots
    // Factor in hitbox size
    players.forEach(player => {
        var shots = [];
        var ownShots = [];

        if(player.who === 1){
            shots = player2.shots;
            ownShots = player1.shots;

        }else{
            shots = player1.shots;
            ownShots = player2.shots;
        }

        for(var i=0; i<shots.length; i++) {

            var pos = [shots[i].pos[0] + shots[i].sprite.boxpos[0], shots[i].pos[1] + shots[i].sprite.boxpos[1]];
            var size = shots[i].sprite.boxsize;

            var playerPos = [player.pos[0] + player.sprite.boxpos[0], player.pos[1] + player.sprite.boxpos[1]];
            var playerSize = player.sprite.boxsize;

            for(var j=0; j<ownShots.length; j++) {
                var pos2 = [ownShots[j].pos[0] + ownShots[j].sprite.boxpos[0], ownShots[j].pos[1] + ownShots[j].sprite.boxpos[1]];
                var size2 = ownShots[j].sprite.boxsize;

                if(shots[i].sprite.state === "moving" && ownShots[j].sprite.state === "moving" &&boxCollides(pos, size, pos2, size2)) {
                    // Remove the shots if they collide
                    shots[i].sprite.state = "hit";
                    ownShots[j].sprite.state = "hit";
                }
            }

            if(boxCollides(pos, size, playerPos, playerSize) && (player.invulnerable < Date.now() - invulnerableTime)){

                if(!shots[i]){break;}   // strange bug

                if(shots[i].sprite.state === "hit"){break;}

                if(shots[i] && (player.sprite.priority < shots[i].sprite.priority || player.sprite.state === "crouch" || player.sprite.state === "supershot")){
                    player.damaged(shots[i]);

                }else if(player.sprite.priority > shots[i].sprite.priority){
                    // REFLECT TIME!

                    var whichShot = "img/shot.png";
                    if(shots[i].speed > 220){
                        whichShot = "img/shot2.png"
                    }
                    if(shots[i].speed > 320){
                        whichShot = "img/shot3.png"
                    }
                    player.shots.push({ 
                        pos: [shots[i].pos[0], shots[i].pos[1]],
                        direction: player.direction,
                        sprite: new Sprite(whichShot, [64 * 4, 0], [64, 64], [22, 13], [24, 38], normalSpeed * 1.5, [0, 1, 2, 3], "horizontal", false, "moving"),
                        fireTime: Date.now() - shotChargeTime,
                        speed: shots[i].speed+35
                       });
                    shots[i].sprite.state = "hit";

                    framesToSkip = 10;
                    
                }
            }

        }
    })
}

function checkPlayerBounds(dt) {

    players.forEach(player => {
        // Check side bounds (enforce at hitbox)
        if(player.pos[0]  < - player.sprite.boxpos[0]) {
            player.pos[0] = - player.sprite.boxpos[0];
            if(player.capacity > bounceCapacity){
                player.velocityX = -player.velocityX/4;
                if(player.sprite.state === "hurt" && Date.now() > shakeUntil+ shakeCd && player.velocityX > groundBounceVelocity/16){
                    shakeUntil = Date.now() + shakeDuration;
                	//console.log(shakeUntil)
                }
            }else{
                player.velocityX = 0;
            }
        }
        else if(player.pos[0] > canvas.width - player.sprite.boxpos[0] - player.sprite.boxsize[0]) {
            player.pos[0] = canvas.width - player.sprite.boxpos[0] - player.sprite.boxsize[0];
            if(player.capacity > bounceCapacity){
                player.velocityX = -player.velocityX/4;
                if(player.sprite.state === "hurt" && Date.now() > shakeUntil+ shakeCd && player.velocityX < -groundBounceVelocity/16){

                    shakeUntil = Date.now() + shakeDuration;
                }
            }else{
                player.velocityX = 0;
            }
        }

        // Check top and lower bounds
        if(player.pos[1]  < - player.sprite.boxpos[1]) {
            player.pos[1] = - player.sprite.boxpos[1];
            if(player.capacity > bounceCapacity){
                player.velocityY = -player.velocityY/4;
                if(player.sprite.state === "hurt" && Date.now() > shakeUntil+ shakeCd){

                    shakeUntil = Date.now() + shakeDuration;
                }
            }else{
                player.velocityY = 0;
            }
        }
        else if(player.pos[1] > canvas.height - groundHeight - player.sprite.boxpos[1] - player.sprite.boxsize[1]) {
            if(player.capacity > bounceCapacity && player.sprite.state === "hurt" && player.velocityY > groundBounceVelocity){
                //console.log("times", player.velocityY )
                player.velocityY = -player.velocityY/4;
                if(player.sprite.state === "hurt" && Date.now() > shakeUntil+ shakeCd){

                    shakeUntil = Date.now() + shakeDuration;
                }
            }else{
                player.velocityY = 0;
            }

            // sliding physics
            if(player.velocityX < 0){
                player.velocityX += gravityAccelerationX * 30 * dt;
            }
            if(player.velocityX > 0){
                player.velocityX -= gravityAccelerationX * 30 * dt;
            }

            player.sprite.speed = normalSpeed;


            if(player.sprite.state !== "supershot" && player.sprite.state !== "hurt" && player.sprite.state !== "crouch" && player.sprite.state !== "dead" && player.sprite.state !== "tp" && player.sprite.state !== "punch"){   // these are the actions that cannot be interrupted once begun
                player.sprite.state = "idle";
            }

            player.pos[1] = canvas.height - groundHeight - player.sprite.boxpos[1] - player.sprite.boxsize[1];
        }
    })
}


// // Draw everything
function render() {

    
    var bgMidPt = slowMidPt;


    if(Math.floor(slowMidPt) < Math.floor(midPt)){
        slowMidPt += 1; 
    }else if(Math.floor(slowMidPt) > Math.floor(midPt)){
        slowMidPt -= 1; 
    }

    // flip direction if opponent on other side
    if(player1.pos[0] < player2.pos[0]){
        player1.direction = 'RIGHT';
        player2.direction = 'LEFT';
    }else{
        player1.direction = 'LEFT';
        player2.direction = 'RIGHT';
    }

    // flip sprites of each player as per direction
    players.forEach(player => {
        if(player.direction === 'LEFT'){
            player.sprite.flipped = true;
        }else{  player.sprite.flipped = false;}
    })


    renderEntity(player1);
    renderEntity(player2);

    renderEntities(player1.shots);
    renderEntities(player2.shots);
    renderEntities(explosions);

    
};



function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        //ctx.save();
        //ctx.translate(list[i].pos[0], list[i].pos[1]);
        //  this will check if enough time has passed before rendering shot
        if(list[i].sprite.state === "dmg" || Date.now() - list[i].fireTime > shotChargeTime){
            list[i].sprite.render(null);
        }
        //ctx.restore();
    }    
}

function renderEntity(entity, flipped) {
    //ctx.save();
    //ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(null, flipped);
   // ctx.restore();
}

// Game over
function gameOver(player) {
    if(gameState !== "over"){
        gameStateSet = Date.now();
        gameState = "over";

        setTimeout(()=>{
            drawNow = true;
            whoLostLast = player.who;
        },1500);
    }

    player.sprite.state = "dead"; 
    disableControls = true;
}


// Reset game to original state
function reset(bool) {
    disableControls = false;
    drawNow = false;
    if(bool){
        gameState= "menu";
    }else{
        gameState = "play";
    }

    whoLostLast = 0;

    players.forEach(player => {
        player.health = maxHealth;     
        player.capacity = startCapacity;
        player.sprite.state = "idle"  
    })

    player1.pos = [50, canvas.height - groundHeight];
    player2.pos = [canvas.width - 100, canvas.height - groundHeight];
};

exports.handleInput = handleInput;
