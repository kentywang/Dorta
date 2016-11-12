// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();


// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 272;
canvas.height = 160;
document.body.appendChild(canvas);


// The main game loop
var lastTime;
var framesToSkip = 0;
var disableControls = false;
var endFrameSkipDuration = 1000;
var midPt;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    if(shakeUntil > Date.now()){
        preShake();
    }

    if(framesToSkip === 0){
        update(dt);
        backgroundRender();
        render();
    }
    if(framesToSkip > 0){
    // skip a frame if hit was registered in either player's .damage method
        framesToSkip--;
    }

    postShake();

    lastTime = now;

    requestAnimFrame(main);


};


function init() {
    ctx.imageSmoothingEnabled = false;

    var bg1 = resources.get('img/parallax-forest-front-trees.png');
    var bg2 = resources.get('img/parallax-forest-middle-trees.png');
    var bg3 = resources.get('img/parallax-forest-lights.png');
    var bg4 = resources.get('img/parallax-forest-back-trees.png');

    // tempCanvas to quadruple background size
    var tempCanvas = document.createElement("canvas");
    var tCtx = tempCanvas.getContext("2d");
    tempCanvas.width = 272 * 3;
    tempCanvas.height = 160;

    tCtx.drawImage(bg4, 0, 0, bg4.width, bg4.height);
    tCtx.drawImage(bg3, 0, 0, bg3.width, bg3.height);
    tCtx.drawImage(bg2, 0, 0, bg2.width, bg2.height);
    tCtx.drawImage(bg1, 0, 0, bg1.width, bg1.height);

    terrainPattern = ctx.createPattern(tempCanvas, 'repeat'); 

    document.getElementById('play-again').addEventListener('click', function() {
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    'img/cat.png',
    'img/cat2.png',
    'img/catGreen.png',
    'img/cat2Green.png',
    'img/catPurple.png',
    'img/cat2Purple.png',
    'img/shot.png',
    'img/shot2.png',
    'img/shot3.png',
    'img/parallax-forest-lights.png',
    'img/parallax-forest-back-trees.png',
    'img/parallax-forest-middle-trees.png',
    'img/parallax-forest-front-trees.png',
    'img/empty.png',
    'img/damage.png',
    'img/health.png',
]);
resources.onReady(init);


// Speed in pixels per second
var playerSpeed = 70;
var normalSpeed = 6;    // frames per second of sprite
var shotSpeed = 140;
// var enemySpeed = 50;
var invulnerableTime = 800;
var regenAmt = .5;
var maxHealth = 100;
var startCapacity = 350;

// Cooldowns
var supershotCd = 1.5 * 1000;
var jumpCd = .25 * 1000;
var kickCd = 1 * 1000;
var punchCd = .6 * 1000;
var shotChargeTime = .5 * 1000;


// Physics
var playerJump = 300;
var gravityAccelerationY = 800;
var gravityAccelerationX = 20;
var groundHeight = 5;
var bounceCapacity= 100;
var bounceCapacity2= 450;
var groundBounceVelocity = 450;

var shakeCd = 1 * 1000;
var shakeDuration = 200;
var shakeUntil = 0;

// Utility functions
function numberBetween(n, m){
    return Math.ceil(Math.random() * (m - n) + n);
}
// Shake, shake, shake
function preShake() {
  ctx.save();
  var dx = Math.random()*4;
  var dy = Math.random()*4;
  ctx.translate(dx, dy);  
}
function postShake() {
  ctx.restore();
}

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
            return; // return instead of just breaking because don't want to give inv frames or hurt status
        case ("uppercut"):
            pushback(numberBetween(8,10), "sideUp");
            break;
        case ("kick"):
            pushback(numberBetween(11,13));
            break;
        case ("downkick"):
            pushback(numberBetween(12,18), "down");
            break;
        case ("punch"):
            pushback(11);
            break;
        case ("airkick"):
            pushback(12);
            break;
        case ("sidekick"):
            pushback(numberBetween(11,17), "sideDown");
            break;
        case ("moving"):
            // have multiple cases here for difference levels of shot
            pushback(player.speed/8);
            player.sprite.state = "hit";
            break;
        default:
            break;
    }
    this.invulnerable = Date.now();
    this.sprite.state = "hurt";
}

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
    lastStableHp: maxHealth
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
    lastStableHp: maxHealth
};

var players = [player1, player2];
var enemies = [];
var explosions = [];

var gameState = "play";
var gameStateSet = 0;
var gameTime = 0;
var isGameOver;
var terrainPattern;

// The score
var oneHP = document.getElementById('one-hp');
var oneCP = document.getElementById('one-cp');
var twoHP = document.getElementById('two-hp');
var twoCP = document.getElementById('two-cp');


// Update game objects
function update(dt) {
    gameTime += dt;

    midPt = (player1.pos[0]+player1.sprite.boxpos[0] + player2.pos[0] + player2.sprite.boxpos[0] + player2.sprite.boxsize[0])/2 - 136;

    players.forEach(player => {
        if(Date.now() - gameStateSet < 1000){
            framesToSkip = 5
        }

        if(player.health <= 0 && gameState !== "over"){
            //shoot player off a bit when they die
            // if(player.velocityX > 0){
            //     player.velocityX += playerJump;
            // }if(player.velocityX < 0){
            //     player.velocityX -= playerJump;
            // }
            // if(player.velocityY > 0){
            //     player.velocityY += playerJump;
            // }if(player.velocityY <= 0){
            //     player.velocityY -= playerJump;
            // }
            gameState = "over";
            gameOver(player);
        }
        //console.log(player.health <= (maxHealth - regenAmt))
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


    if(!disableControls){ handleInput(dt);}
    processPhysics(dt);
    updateEntities(dt);
    checkCollisions(dt);

    oneHP.innerHTML = player1.health;
    oneCP.innerHTML = player1.capacity;
    twoHP.innerHTML = player2.health;
    twoCP.innerHTML = player2.capacity;
};


function handleInput(dt) {
    players.forEach(player =>{
        switch(player.sprite.state){
            case("idle"):
                if(input.isDown(player.keys.JUMP) && input.isDown(player.keys.LEFT)) {
                    //if(Date.now() - player.lastLand < 250){ break;}
                    player.sprite.state = "jump";
                    player.velocityY = -playerJump;
                    player.velocityX = -playerJump/4;
                    player.lastJump = Date.now();
                }

                else if(input.isDown(player.keys.JUMP) && input.isDown(player.keys.RIGHT)) {
                    //if(Date.now() - player.lastLand < 250){ break;}
                    player.sprite.state = "jump";
                    player.velocityY = -playerJump;
                    player.velocityX = playerJump/4;
                    player.lastJump = Date.now();
                }

                else if(input.isDown(player.keys.JUMP)) {
                    //if(Date.now() - player.lastLand < 250){ break;}
                    player.sprite.state = "jump";
                    player.velocityY = -playerJump;
                    player.lastJump = Date.now();
                }

                else if(input.isDown(player.keys.BASIC) && input.isDown(player.keys.UP)) {
                    if(Date.now() - player.lastJump < jumpCd){ break;}
                    player.sprite.state = "uppercut";
                    player.velocityY = -playerJump /1.2;

                    if(player.direction === "RIGHT"){
                        player.velocityX = playerJump /5;
                    }
                    else{   
                        player.velocityX = -playerJump /5;
                    }
                    player.lastJump = Date.now();
                }
                
                else if(input.isDown(player.keys.BASIC)) {
                    //console.log(Date.now() - player.lastPunch)
                    if(Date.now() - player.lastPunch < punchCd){ 
                        break;}
                    player.sprite.state = "punch";
                    player.lastPunch = Date.now();
                    //console.log(player.sprite.state)
                }

                else if(input.isDown(player.keys.SPECIAL)) {
                    //  break if last shot in array isn't past cooldown timing
                    if(player.shots.length && Date.now() - player.shots[player.shots.length - 1].fireTime < supershotCd){ 
                        break;}

                    player.sprite.state = "supershot";

                    var x = player.pos[0] + player.sprite.boxsize[0] / 4;
                    var y = player.pos[1] + player.sprite.boxsize[1] / 8;
                    player.shots.push({ pos: [x, y],
                           direction: player.direction,
                           sprite: new Sprite('img/shot.png', [64 * 4, 0], [64, 64], [22, 13], [24, 38], normalSpeed * 1.5, [0, 1, 2, 3]),
                           fireTime: Date.now(),
                           speed: shotSpeed
                       });
                    //console.log(player.shots[player.shots.length-1].direction)
                }
                
                else if(input.isDown(player.keys.LEFT)) {
                    player.sprite.state = "walk";
                    player.pos[0] -= playerSpeed * dt;    
                }

                else if(input.isDown(player.keys.RIGHT)) {
                    player.sprite.state = "walk";
                    player.pos[0] += playerSpeed * dt;
                }

                else if(input.isDown(player.keys.DOWN)) {
                    player.sprite.state = "crouch";
                }
                break;

            case("jump"):   // these are midair actions
                if(input.isDown(player.keys.JUMP) && input.isDown(player.keys.LEFT)) {
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

                else if(input.isDown(player.keys.JUMP) && input.isDown(player.keys.RIGHT)) {
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

                else if(input.isDown(player.keys.JUMP)) {
                    if(Date.now() - player.lastJump > jumpCd){
                        player.sprite.state = "jump2";
                        player.velocityY = -playerJump /1.2;
                        player.lastJump = Date.now();
                    }
                }

                else if(input.isDown(player.keys.BASIC) && (input.isDown(player.keys.LEFT) || input.isDown(player.keys.RIGHT))) {
                    player.sprite.state = "sidekick";
                    
                    if(player.direction === "RIGHT"){
                        player.velocityX = playerJump /2;
                    }
                    else{   
                        player.velocityX = -playerJump /2;
                    }

                    player.velocityY = playerJump /3;
                }

                else if(input.isDown(player.keys.BASIC) && input.isDown(player.keys.DOWN)) {
                        player.sprite.state = "downkick";
                        player.velocityX = 0;
                        player.velocityY = playerJump /1.5;
                }

                else if(input.isDown(player.keys.BASIC) && input.isDown(player.keys.UP)) {
                    if(Date.now() - player.lastJump < jumpCd){ break;}
                    player.sprite.state = "uppercut";
                    player.velocityY = -playerJump /1.2;

                    if(player.direction === "RIGHT"){
                        player.velocityX = playerJump /5;
                    }
                    else{   
                        player.velocityX = -playerJump /5;
                    }
                    player.lastJump = Date.now();
                }

                else if(input.isDown(player.keys.BASIC)) {
                        player.sprite.state = "airkick";
                }

                else if(input.isDown(player.keys.LEFT)) {
                    if(player.velocityX <= 0){
                        player.velocityX -= playerJump /4 * dt;
                    }
                    else if(player.velocityX > 0){
                        player.velocityX -= playerJump /8 * dt;
                    }
                }

                else if(input.isDown(player.keys.RIGHT)) {
                    if(player.velocityX < 0){
                        player.velocityX += playerJump /8 * dt;
                    }
                    else if(player.velocityX >= 0){
                        player.velocityX += playerJump /4 * dt;
                    }
                }
                break;
            case("jump2"):   // these are midair actions
                 if(input.isDown(player.keys.JUMP) && input.isDown(player.keys.LEFT)) {
                    if(player.velocityX <= 0){
                        player.velocityX -= playerJump /4 * dt;
                    }
                    else if(player.velocityX > 0){
                        player.velocityX -= playerJump /8 * dt;
                    }
                }

                else if(input.isDown(player.keys.JUMP) && input.isDown(player.keys.RIGHT)) {
                    if(player.velocityX < 0){
                        player.velocityX += playerJump /8 * dt;
                    }
                    else if(player.velocityX >= 0){
                        player.velocityX += playerJump /4 * dt;
                    }
                }

                else if(input.isDown(player.keys.BASIC) && (input.isDown(player.keys.LEFT) || input.isDown(player.keys.RIGHT))) {
                    player.sprite.state = "sidekick";
                    
                    if(player.direction === "RIGHT"){
                        player.velocityX = playerJump /2;
                    }
                    else{   
                        player.velocityX = -playerJump /2;
                    }

                    player.velocityY = playerJump /3;
                }

                else if(input.isDown(player.keys.BASIC) && input.isDown(player.keys.DOWN)) {
                        player.sprite.state = "downkick";
                        player.velocityX = 0;
                        player.velocityY = playerJump /1.5;
                }

                else if(input.isDown(player.keys.BASIC) && input.isDown(player.keys.UP)) {
                    if(Date.now() - player.lastJump < jumpCd){ break;}
                    player.sprite.state = "uppercut";
                    player.velocityY = -playerJump /1.2;

                    if(player.direction === "RIGHT"){
                        player.velocityX = playerJump /5;
                    }
                    else{   
                        player.velocityX = -playerJump /5;
                    }

                    player.lastJump = Date.now();
                }

                else if(input.isDown(player.keys.BASIC)) {
                        player.sprite.state = "airkick";
                }
                
                else if(input.isDown(player.keys.DOWN)) {
                    // player.sprite.state = "walk";
                    // player.pos[1] += playerSpeed * dt;
                }

                else if(input.isDown(player.keys.LEFT)) {
                    if(player.velocityX <= 0){
                        player.velocityX -= playerJump /4 * dt;
                    }
                    else if(player.velocityX > 0){
                        player.velocityX -= playerJump /8 * dt;
                    }
                }

                else if(input.isDown(player.keys.RIGHT)) {
                    if(player.velocityX < 0){
                        player.velocityX += playerJump /8 * dt;
                    }
                    else if(player.velocityX >= 0){
                        player.velocityX += playerJump /4 * dt;
                    }
                }
                break;
            default:
                break;
        }
    })
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
        //console.log(player1.shots.length, player2.shots.length)
        player.sprite.update(dt);

        // Update all the shots
        for(var i=0; i<player.shots.length; i++) {
            //  this will check if enough time has passed before moving shot
            if(Date.now() - player.shots[i].fireTime < shotChargeTime){ break;}

            var shot = player.shots[i];

            switch(shot.direction) {
                case 'LEFT': shot.pos[0] -= shot.speed * dt; break;
                case 'RIGHT': shot.pos[0] += shot.speed * dt; break;
                default:
                    shot.pos[0] = 0;
            }

            // flip shot if direction is left
            if(shot.direction === "LEFT"){
                shot.sprite.flipped = true;
            }else{
                shot.sprite.flipped = false;
            }

            player.shots[i].sprite.update(dt);

                //console.log(shot.pos)
            // Remove the shot if it goes offscreen
            if(shot.pos[1] < 0 || shot.pos[1] > canvas.height ||
               shot.pos[0] > canvas.width || shot.pos[0] + shot.sprite.boxsize[0] + shot.sprite.boxpos[0]< 0) {
                player.shots.splice(i, 1);
                i--;
            }
        }

        // // Update all the explosions
        // for(var i=0; i<explosions.length; i++) {
        //     explosions[i].sprite.update(dt);

        //     // Remove if animation is done
        //     if(explosions[i].sprite.done) {
        //         explosions.splice(i, 1);
        //         i--;
        //     }
        // }
    })

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
                player2.damaged(player1);
            }
        }else if(player1.sprite.priority < player2.sprite.priority){
            if(player2.sprite.priority > 0){
                player1.damaged(player2);
            }
        }else{
            if(player1.sprite.priority > 0){
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
            //console.log(shots)
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

                if(boxCollides(pos, size, pos2, size2)) {
                    // Remove the shots if they collide
                    shots[i].sprite.state = "hit";
                    shots.splice(i--, 1); 
                    ownShots[j].sprite.state = "hit";
                    ownShots.splice(j--, 1);
                    //break;
                }
            }
            // console.log(player.who, pos) 
            if(boxCollides(pos, size, playerPos, playerSize) && (player.invulnerable < Date.now() - invulnerableTime)){
                if(!shots[i]){break;}   // strange bug
                if(shots[i] && (player.sprite.priority < shots[i].sprite.priority || player.sprite.state === "crouch" || player.sprite.state === "supershot")){
                    player.damaged(shots[i]);

                }else if(player.sprite.priority > shots[i].sprite.priority){
                    // REFLECT TIMEEEE!

                    var whichShot = "img/shot.png";
                    if(shots[i].speed > 200){
                        whichShot = "img/shot2.png"
                    }
                    if(shots[i].speed > 300){
                        whichShot = "img/shot3.png"
                    }
                    player.shots.push({ 
                        pos: [shots[i].pos[0], shots[i].pos[1]],    // fucking arrays...
                        direction: player.direction,
                        sprite: new Sprite(whichShot, [64 * 4, 0], [64, 64], [22, 13], [24, 38], normalSpeed * 1.5, [0, 1, 2, 3], "horizontal", false, "moving"),
                        fireTime: Date.now() - shotChargeTime,
                        speed: shots[i].speed+35
                       });
                    shots.splice(i--, 1);
                    framesToSkip = 3;
                    
                }
            }

        }
    })
}

function checkPlayerBounds(dt) {
    // BUILD A CORNER CASE... LITERALLY
    players.forEach(player => {
        // Check side bounds (enforce at hitbox)
        if(player.pos[0]  < - player.sprite.boxpos[0]) {
            player.pos[0] = - player.sprite.boxpos[0];
            if(player.capacity > bounceCapacity){
                player.velocityX = -player.velocityX/4;
                if(player.sprite.state === "hurt" && Date.now() > shakeUntil+ shakeCd && player.velocityX > groundBounceVelocity/16){
                    //framesToSkip = 5;
                    shakeUntil = Date.now() + shakeDuration;
                }
            }else{
                player.velocityX = 0;
            }
        }
        else if(player.pos[0] > canvas.width - player.sprite.boxpos[0] - player.sprite.boxsize[0]) {
            player.pos[0] = canvas.width - player.sprite.boxpos[0] - player.sprite.boxsize[0];
            if(player.capacity > bounceCapacity){
                player.velocityX = -player.velocityX/4;
                if(player.sprite.state === "hurt" && Date.now() > shakeUntil+ shakeCd && player.velocityX > groundBounceVelocity/16){
                    //framesToSkip = 5;
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
                    //framesToSkip = 5;
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
                    //framesToSkip = 5;
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


            if(player.sprite.state !== "supershot" && player.sprite.state !== "hurt" && player.sprite.state !== "kick"  && player.sprite.state !== "punch" && player.sprite.state !== "crouch" && player.sprite.state !== "dead"){   // these are the actions that cannot be interrupted once begun
                player.sprite.state = "idle";
            }

            player.pos[1] = canvas.height - groundHeight - player.sprite.boxpos[1] - player.sprite.boxsize[1];
        }
    })
}

function backgroundRender(){
    // var bg1 = resources.get('img/parallax-forest-front-trees.png');
    // var bg2 = resources.get('img/parallax-forest-middle-trees.png');
    // var bg3 = resources.get('img/parallax-forest-lights.png');
    // var bg4 = resources.get('img/parallax-forest-back-trees.png');

    // var tempCanvas = document.createElement("canvas");
    // var tCtx = tempCanvas.getContext("2d");
    // tempCanvas.width = 272 * 3;
    // tempCanvas.height = 160;
    // tCtx.translate(midPt, 0);  
    // // tCtx.drawImage(bg4, 0, 0, bg4.width, bg4.height);
    // // tCtx.drawImage(bg3, 0, 0, bg3.width, bg3.height);
    // // tCtx.drawImage(bg2, 0, 0, bg2.width, bg2.height);
    // // tCtx.drawImage(bg1, 0, 0, bg1.width, bg1.height);
    // tCtx.fillStyle = tCtx.createPattern(bg1, "repeat");;
    // tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // terrainPattern = ctx.createPattern(tempCanvas, 'repeat'); 
}

// Draw everything
function render() {

    // parallax background rendering first
    var bg1 = resources.get('img/parallax-forest-front-trees.png');
    var bg2 = resources.get('img/parallax-forest-middle-trees.png');
    var bg3 = resources.get('img/parallax-forest-lights.png');
    var bg4 = resources.get('img/parallax-forest-back-trees.png');
    
    ctx.save();
    ctx.translate(-midPt/8, 0);
    for (var i = -1; i < 2; i++) {
        ctx.drawImage(bg4, i * 272, 0);
    }
    ctx.restore();
    
    ctx.save();
    ctx.drawImage(bg3, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(-midPt/6, 0);
    for (var i = -1; i < 2; i++) {
        ctx.drawImage(bg2, i * 272, 0);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-midPt/2, 0);
    for (var i = -1; i < 2; i++) {
        ctx.drawImage(bg1, i * 272, 0);
    }
    ctx.restore();



    //ctx.fillStyle = terrainPattern;
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    //console.log(player1.shots[0] && player1.shots[0].sprite.status);

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

    // Render the player if the game isn't over
    //if(!isGameOver) {
        renderEntity(player1);
        renderEntity(player2);
    //}

    renderEntities(player1.shots);
    renderEntities(player2.shots);
    // renderEntities(explosions);
    renderHealth(player1);
    renderHealth(player2, true);
};

function renderHealth(entity, flipped) {
    var barLen = 72;

    var amt = entity.health/100 * barLen;

    var stableAmt = entity.lastStableHp/100 * barLen;
    if(entity.lastStableHp <= entity.health){
        entity.lastStableHp = entity.health;
    }
    // if(damageAmt <= amt){
    //     damageAmt = amt
    //     entity.lastStableHp = damageAmt;
    // }

    ctx.save();
    if(!flipped){
        ctx.translate(30, 15);
        ctx.drawImage(resources.get("img/empty.png"),0,0,72,6,0,0,72,6);
        if(entity.sprite.state === "dead" || entity.invulnerable < Date.now() - invulnerableTime){
            ctx.drawImage(resources.get("img/damage.png"),0,0,stableAmt,6,0,0,stableAmt,6);
            entity.lastStableHp -= .8;
        }else{
            ctx.drawImage(resources.get("img/damage.png"),0,0,stableAmt,6,0,0,stableAmt,6);
        }
        ctx.drawImage(resources.get("img/health.png"),0,0,amt,6,0,0,amt,6);
    }else{
        ctx.translate(240, 15);
        ctx.scale(-1, 1);
        ctx.drawImage(resources.get("img/empty.png"),0,0,72,6,0,0,72,6);
        if(entity.sprite.state === "dead" || entity.invulnerable < Date.now() - invulnerableTime){
            ctx.drawImage(resources.get("img/damage.png"),0,0,stableAmt,6,0,0,stableAmt,6);
            entity.lastStableHp -= .8;
        }else{
            ctx.drawImage(resources.get("img/damage.png"),0,0,stableAmt,6,0,0,stableAmt,6);
        }
        ctx.drawImage(resources.get("img/health.png"),0,0,amt,6,0,0,amt,6);
    }

    //damageAmt -= 0.1
    ctx.restore();
};

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        ctx.save();
        ctx.translate(list[i].pos[0], list[i].pos[1]);
        //  this will check if enough time has passed before rendering shot
        if(Date.now() - list[i].fireTime > shotChargeTime){
            //console.log(list[i].sprite.status)
            list[i].sprite.render(ctx);
        }
        ctx.restore();
    }    
}

function renderEntity(entity, flipped) {
    //console.log(entity)
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx, flipped);
    ctx.restore();
}

// Game over
function gameOver(player) {
    gameStateSet = Date.now();
    player.sprite.state = "dead"; 
    disableControls = true;
    setTimeout(()=>{
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('game-over-overlay').style.display = 'block';
        },1500);
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    disableControls = false;
    gameState = "play;"

    players.forEach(player => {
        player.health = maxHealth;     
        player.capacity = startCapacity;
        player.sprite.state = "idle"  
    })

    player1.pos = [50, canvas.height - groundHeight];
    player2.pos = [canvas.width - 100, canvas.height - groundHeight];
};