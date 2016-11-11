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
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

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
    'img/shot.png',
    'img/parallax-forest-lights.png',
    'img/parallax-forest-back-trees.png',
    'img/parallax-forest-middle-trees.png',
    'img/parallax-forest-front-trees.png'
]);
resources.onReady(init);


// Speed in pixels per second
var playerSpeed = 70;
var normalSpeed = 6;    // frames per second of sprite
var shotSpeed = 140;
var enemySpeed = 50;

// Cooldowns
var supershotCd = 1.5 * 1000;
var jumpCd = .25 * 1000;
var kickCd = 1 * 1000;
var shotChargeTime = .5 * 1000;

// Physics
var playerJump = 300;
var gravityAccelerationY = 800;
var gravityAccelerationX = 20;
var groundHeight = 5;

// Game state
var player1 = {
    pos: [0, 0],
    velocityY: 0,
    velocityX: 0,
    sprite: new PlayerSprite('img/cat.png', [0, 0], [64, 64], [25, 26], [12, 28], normalSpeed, [0, 1, 2, 3]),
    lastJump: Date.now(),
    lastLand: Date.now(),
    lastKick: Date.now(),
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
        ULTI: "E"
    }
};

var player2 = {
    pos: [0, 0],
    velocityY: 0,
    velocityX: 0,
    sprite: new PlayerSprite('img/cat.png', [0, 0], [64, 64], [25, 26], [12, 28], normalSpeed, [0, 1, 2, 3]),
    lastJump: Date.now(),
    lastLand: Date.now(),
    lastKick: Date.now(),
    direction: 'LEFT',
    shots: [],
    keys: {
        UP: "U",
        DOWN: "E",
        LEFT: "N",
        RIGHT: "I",
        JUMP: "M",
        BASIC: "1",
        SPECIAL: "2",
        ULTI: "3"
    }
};

var players = [player1, player2];
var enemies = [];
var explosions = [];

var gameTime = 0;
var isGameOver;
var terrainPattern;

// The score
var score = 0;
var scoreEl = document.getElementById('score');


// Update game objects
function update(dt) {
    gameTime += dt;

    handleInput(dt);
    processPhysics(dt);
    updateEntities(dt);

    // It gets harder over time by adding enemies using this
    // equation: 1-.993^gameTime
    // if(Math.random() < .4) {
    //     enemies.push({
    //         pos: [canvas.width,
    //               Math.random() * canvas.height - 32],
    //         sprite: new PlayerSprite('img/cat.png', [0, 0], [64, 64], [25, 26], [12,28], 6, [0, 1, 2, 3])
    //     });
    // }

    checkCollisions(dt);

    scoreEl.innerHTML = score;
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

                    if(player.direction === player.keys.RIGHT){
                        player.velocityX = playerJump /5;
                    }
                    else{   
                        player.velocityX = -playerJump /5;
                    }
                    player.lastJump = Date.now();
                }

                // else if(input.isDown(player.keys.BASIC) && (input.isDown(player.keys.LEFT) || input.isDown(player.keys.RIGHT))) {
                //         if(Date.now() - player.lastKick < kickCd){ break;}

                //         player.sprite.state = "kick";

                //         if(player.direction === player.keys.RIGHT){
                //             player.velocityX = playerJump /3;
                //         }
                //         else{   
                //             player.velocityX = -playerJump /3;
                //         }
                //         player.lastKick = Date.now();
                // }
                

                else if(input.isDown(player.keys.BASIC)) {
                    player.sprite.state = "punch";
                }

                else if(input.isDown(player.keys.SPECIAL)) {
                    //  break if last shot in array isn't past cooldown timingw
                    if(player.shots.length && Date.now() - player.shots[player.shots.length - 1].fireTime < supershotCd){ 
                        break;}

                    player.sprite.state = "supershot";

                    var x = player.pos[0] + player.sprite.boxsize[0] / 4;
                    var y = player.pos[1] + player.sprite.boxsize[1] / 8;
                    player.shots.push({ pos: [x, y],
                           dir: 'forward',
                           sprite: new Sprite('img/shot.png', [64 * 4, 0], [64, 64], [22, 13], [24, 38], normalSpeed * 1.5, [0, 1, 2, 3]),
                           fireTime: Date.now()
                       });
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
                    
                    if(player.direction === player.keys.RIGHT){
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

                    if(player.direction === player.keys.RIGHT){
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
                    
                    if(player.direction === player.keys.RIGHT){
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

                    if(player.direction === player.keys.RIGHT){
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


    // switch(player2.sprite.state){
    //     case("idle"):
    //         if(input.isDown('H') && input.isDown('7')) {
    //             //if(Date.now() - player2.lastLand < 250){ break;}
    //             player2.sprite.state = "jump";
    //             player2.velocityY = -playerJump;
    //             player2.velocityX = -playerJump/4;
    //             player2.lastJump = Date.now();
    //         }

    //         else if(input.isDown('H') && input.isDown('0')) {
    //             //if(Date.now() - player2.lastLand < 250){ break;}
    //             player2.sprite.state = "jump";
    //             player2.velocityY = -playerJump;
    //             player2.velocityX = playerJump/4;
    //             player2.lastJump = Date.now();
    //         }

    //         else if(input.isDown('H')) {
    //             //if(Date.now() - player2.lastLand < 250){ break;}
    //             player2.sprite.state = "jump";
    //             player2.velocityY = -playerJump;
    //             player2.lastJump = Date.now();
    //         }

    //         else if(input.isDown('1') && input.isDown('9')) {
    //             if(Date.now() - player2.lastJump < jumpCd){ break;}
    //             player2.sprite.state = "uppercut";
    //             player2.velocityY = -playerJump /1.2;

    //             if(player2.direction === "0"){
    //                 player2.velocityX = playerJump /5;
    //             }
    //             else{   
    //                 player2.velocityX = -playerJump /5;
    //             }
    //             player2.lastJump = Date.now();
    //         }

    //         // else if(input.isDown('1') && (input.isDown('7') || input.isDown('0'))) {
    //         //         if(Date.now() - player2.lastKick < kickCd){ break;}

    //         //         player2.sprite.state = "kick";

    //         //         if(player2.direction === "0"){
    //         //             player2.velocityX = playerJump /3;
    //         //         }
    //         //         else{   
    //         //             player2.velocityX = -playerJump /3;
    //         //         }
    //         //         player2.lastKick = Date.now();
    //         // }
            

    //         else if(input.isDown('1')) {
    //             player2.sprite.state = "punch";
    //         }

    //         else if(input.isDown('2')) {
    //             //  break if last shot in array isn't past cooldown timingw
    //             if(player2.shots.length && Date.now() - player2.shots[player2.shots.length - 1].fireTime < supershotCd){ 
    //                 break;}

    //             player2.sprite.state = "supershot";

    //             var x = player2.pos[0] + player2.sprite.boxsize[0] / 4;
    //             var y = player2.pos[1] + player2.sprite.boxsize[1] / 8;
    //             player2.shots.push({ pos: [x, y],
    //                    dir: 'forward',
    //                    sprite: new Sprite('img/shot.png', [64 * 4, 0], [64, 64], [22, 13], [24, 38], normalSpeed * 1.5, [0, 1, 2, 3]),
    //                    fireTime: Date.now()
    //                });
    //         }
            
    //         else if(input.isDown('7')) {
    //             player2.sprite.state = "walk";
    //             player2.pos[0] -= playerSpeed * dt;    
    //         }

    //         else if(input.isDown('0')) {
    //             player2.sprite.state = "walk";
    //             player2.pos[0] += playerSpeed * dt;
    //         }

    //         else if(input.isDown('8')) {
    //             player2.sprite.state = "crouch";
    //         }



    //         break;
    //     case("jump"):   // these are midair actions
    //         if(input.isDown('H') && input.isDown('7')) {
    //             if(player2.velocityX <= 0){
    //                 player2.velocityX -= playerJump /4 * dt;
    //             }
    //             else if(player2.velocityX > 0){
    //                 player2.velocityX -= playerJump /8 * dt;
    //             }

    //             if(Date.now() - player2.lastJump > jumpCd){
    //                 player2.sprite.state = "jump2";
    //                 player2.velocityY = -playerJump /1.2;
    //                 if(player2.velocityX > 0){
    //                     player2.velocityX = -playerJump/4;
    //                 }
    //                 player2.lastJump = Date.now();
    //             }
    //         }

    //         else if(input.isDown('H') && input.isDown('0')) {
    //             if(player2.velocityX < 0){
    //                 player2.velocityX += playerJump /8 * dt;
    //             }
    //             else if(player2.velocityX >= 0){
    //                 player2.velocityX += playerJump /4 * dt;
    //             }

    //             if(Date.now() - player2.lastJump > jumpCd){
    //                 player2.sprite.state = "jump2";
    //                 player2.velocityY = -playerJump /1.2;
    //                 if(player2.velocityX < 0){
    //                     player2.velocityX = playerJump/4;
    //                 }
    //                 player2.lastJump = Date.now();
    //             }
    //         }

    //         else if(input.isDown('H')) {
    //             if(Date.now() - player2.lastJump > jumpCd){
    //                 player2.sprite.state = "jump2";
    //                 player2.velocityY = -playerJump /1.2;
    //                 player2.lastJump = Date.now();
    //             }
    //         }

    //         else if(input.isDown('1') && (input.isDown('7') || input.isDown('0'))) {
    //             player2.sprite.state = "sidekick";
                
    //             if(player2.direction === "0"){
    //                 player2.velocityX = playerJump /2;
    //             }
    //             else{   
    //                 player2.velocityX = -playerJump /2;
    //             }

    //             player2.velocityY = playerJump /3;
    //         }

    //         else if(input.isDown('1') && input.isDown('8')) {
    //                 player2.sprite.state = "downkick";
    //                 player2.velocityX = 0;
    //                 player2.velocityY = playerJump /1.5;
    //         }

    //         else if(input.isDown('1') && input.isDown('9')) {
    //             if(Date.now() - player2.lastJump < jumpCd){ break;}
    //             player2.sprite.state = "uppercut";
    //             player2.velocityY = -playerJump /1.2;

    //             if(player2.direction === "0"){
    //                 player2.velocityX = playerJump /5;
    //             }
    //             else{   
    //                 player2.velocityX = -playerJump /5;
    //             }
    //             player2.lastJump = Date.now();
    //         }

    //         else if(input.isDown('1')) {
    //                 player2.sprite.state = "airkick";
    //         }

    //         else if(input.isDown('7')) {
    //             if(player2.velocityX <= 0){
    //                 player2.velocityX -= playerJump /4 * dt;
    //             }
    //             else if(player2.velocityX > 0){
    //                 player2.velocityX -= playerJump /8 * dt;
    //             }
    //         }

    //         else if(input.isDown('0')) {
    //             if(player2.velocityX < 0){
    //                 player2.velocityX += playerJump /8 * dt;
    //             }
    //             else if(player2.velocityX >= 0){
    //                 player2.velocityX += playerJump /4 * dt;
    //             }
    //         }
    //         break;
    //     case("jump2"):   // these are midair actions
    //          if(input.isDown('H') && input.isDown('7')) {
    //             if(player2.velocityX <= 0){
    //                 player2.velocityX -= playerJump /4 * dt;
    //             }
    //             else if(player2.velocityX > 0){
    //                 player2.velocityX -= playerJump /8 * dt;
    //             }
    //         }

    //         else if(input.isDown('H') && input.isDown('0')) {
    //             if(player2.velocityX < 0){
    //                 player2.velocityX += playerJump /8 * dt;
    //             }
    //             else if(player2.velocityX >= 0){
    //                 player2.velocityX += playerJump /4 * dt;
    //             }
    //         }

    //         else if(input.isDown('1') && (input.isDown('7') || input.isDown('0'))) {
    //             player2.sprite.state = "sidekick";
                
    //             if(player2.direction === "0"){
    //                 player2.velocityX = playerJump /2;
    //             }
    //             else{   
    //                 player2.velocityX = -playerJump /2;
    //             }

    //             player2.velocityY = playerJump /3;
    //         }

    //         else if(input.isDown('1') && input.isDown('8')) {
    //                 player2.sprite.state = "downkick";
    //                 player2.velocityX = 0;
    //                 player2.velocityY = playerJump /1.5;
    //         }

    //         else if(input.isDown('1') && input.isDown('9')) {
    //             if(Date.now() - player2.lastJump < jumpCd){ break;}
    //             player2.sprite.state = "uppercut";
    //             player2.velocityY = -playerJump /1.2;

    //             if(player2.direction === "0"){
    //                 player2.velocityX = playerJump /5;
    //             }
    //             else{   
    //                 player2.velocityX = -playerJump /5;
    //             }

    //             player2.lastJump = Date.now();
    //         }

    //         else if(input.isDown('1')) {
    //                 player2.sprite.state = "airkick";
    //         }
            
    //         else if(input.isDown('8')) {
    //             // player2.sprite.state = "walk";
    //             // player2.pos[1] += playerSpeed * dt;
    //         }

    //         else if(input.isDown('7')) {
    //             if(player2.velocityX <= 0){
    //                 player2.velocityX -= playerJump /4 * dt;
    //             }
    //             else if(player2.velocityX > 0){
    //                 player2.velocityX -= playerJump /8 * dt;
    //             }
    //         }

    //         else if(input.isDown('0')) {
    //             if(player2.velocityX < 0){
    //                 player2.velocityX += playerJump /8 * dt;
    //             }
    //             else if(player2.velocityX >= 0){
    //                 player2.velocityX += playerJump /4 * dt;
    //             }
    //         }
    //         break;
    //     default:
    //         break;
    // }
    
    //console.log(player1.sprite.state)

    // if(input.isDown(player.keys.UP) &&
    //    !isGameOver &&
    //    Date.now() - lastFire > 100) {
    //     var x = player1.pos[0] + player1.sprite.size[0] / 2;
    //     var y = player1.pos[1] + player1.sprite.size[1] / 2;

    //     bullets.push({ pos: [x, y],
    //                    dir: 'forward',
    //                    sprite: new Sprite('img/sprites.png', [0, 39], [18, 8]) });
    //     bullets.push({ pos: [x, y],
    //                    dir: 'up',
    //                    sprite: new Sprite('img/sprites.png', [0, 50], [9, 5]) });
    //     bullets.push({ pos: [x, y],
    //                    dir: 'down',
    //                    sprite: new Sprite('img/sprites.png', [0, 60], [9, 5]) });

    //     lastFire = Date.now();
    // }
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
        
        //console.log(player.velocityX);
    })

}

function updateEntities(dt) {
    players.forEach(player => {
        // Update the player sprite animation
        player.sprite.update(dt);

        // Update all the shots
        for(var i=0; i<player.shots.length; i++) {
            //  this will check if enough time has passed before moving shot
            if(Date.now() - player.shots[i].fireTime < shotChargeTime){ break;}

            var shot = player.shots[i];

            switch(shot.dir) {
            case 'up': shot.pos[1] -= shotSpeed * dt; break;
            case 'down': shot.pos[1] += shotSpeed * dt; break;
            default:
                shot.pos[0] += shotSpeed * dt;
            }

            player.shots[i].sprite.update(dt);

            // Remove the shot if it goes offscreen
            if(shot.pos[1] < 0 || shot.pos[1] > canvas.height ||
               shot.pos[0] > canvas.width) {
                player.shots.splice(i, 1);
                i--;
            }
        }

        // Update all the enemies
        // for(var i=0; i<enemies.length; i++) {
        //     enemies[i].pos[0] -= enemySpeed * dt;
        //     enemies[i].sprite.update(dt);

        //     // Remove if offscreen
        //     if(enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
        //         enemies.splice(i, 1);
        //         i--;
        //     }
        // }

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
    
    // Run collision detection for all enemies and bullets
    // Factor in hitbox size
    players.forEach(player => {
        for(var i=0; i<enemies.length; i++) {
        var pos = [enemies[i].pos[0] + enemies[i].sprite.boxpos[0], enemies[i].pos[1] + enemies[i].sprite.boxpos[1]];
        var size = enemies[i].sprite.boxsize;

        var p1pos = [player.pos[0] + player.sprite.boxpos[0], player.pos[1] + player.sprite.boxpos[1]];
        var p1size = player.sprite.boxsize;

        // for(var j=0; j<bullets.length; j++) {
        //     var pos2 = bullets[j].pos;
        //     var size2 = bullets[j].sprite.size;

        //     if(boxCollides(pos, size, pos2, size2)) {
        //         // Remove the enemy
        //         enemies.splice(i, 1);
        //         i--;

        //         // Add score
        //         score += 100;

        //         // Add an explosion
        //         explosions.push({
        //             pos: pos,
        //             sprite: new Sprite('img/sprites.png',
        //                                [0, 117],
        //                                [39, 39],
        //                                16,
        //                                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        //                                null,
        //                                true)
        //         });

        //         // Remove the bullet and stop this iteration
        //         bullets.splice(j, 1);
        //         break;
        //     }
        // }

            if(boxCollides(pos, size, p1pos, p1size)) {
                gameOver();
            }
        }
    })
}

function checkPlayerBounds(dt) {
    players.forEach(player => {
        // Check side bounds (enforce at hitbox)
        if(player.pos[0]  < - player.sprite.boxpos[0]) {
            player.velocityX = 0;  // may want to change this to get bouncing
            player.pos[0] = - player.sprite.boxpos[0];
        }
        else if(player.pos[0] > canvas.width - player.sprite.boxpos[0] - player.sprite.boxsize[0]) {
            player.velocityX = 0;  // may want to change this to get bouncing
            player.pos[0] = canvas.width - player.sprite.boxpos[0] - player.sprite.boxsize[0];
        }

        // Check top and lower bounds
        if(player.pos[1]  < - player.sprite.boxpos[1]) {
            player.velocityY = 0;  // may want to change this to get bouncing
            player.pos[1] = - player.sprite.boxpos[1];
        }
        else if(player.pos[1] > canvas.height - groundHeight - player.sprite.boxpos[1] - player.sprite.boxsize[1]) {
            player.velocityY = 0;
            //player.velocityX = 0;    // no sliding

            // sliding physics
            if(player.velocityX < 0){
                player.velocityX += gravityAccelerationX * 30 * dt;
            }
            if(player.velocityX > 0){
                player.velocityX -= gravityAccelerationX * 30 * dt;
            }

            player.sprite.speed = normalSpeed;

            // if(player.sprite.state === "jump" || player.sprite.state === "jump2" || player.sprite.state === "uppercut"){
            //     player.lastLand = Date.now();
            // }

            if(player.sprite.state !== "supershot" && player.sprite.state !== "kick"){   // these are the actions that cannot be interrupted once begun
                player.sprite.state = "idle";
            }


            // // flip direction if opponent on other side
            // if(Object.keys(player.otherPlayer).length && player.pos[0] < player.otherPlayer.pos[0]){
            //     player.direction = player.keys.RIGHT;
            // }else{  player.direction = player.keys.LEFT;}

            player.pos[1] = canvas.height - groundHeight - player.sprite.boxpos[1] - player.sprite.boxsize[1];
        }
    })
}


// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // flip direction if opponent on other side
    // if(player1.pos[0] < player2.pos[0]){
    //     console.log("directino change")
    //     player1.direction = 'RIGHT';
    //     player2.direction = 'LEFT';
    // }else{
    //     player1.direction = 'LEFT';
    //     player2.direction = 'RIGHT';
    // }

    // flip sprites of each player as per direction
    players.forEach(player => {
        if(player.direction === 'LEFT'){
            player.sprite.flipped = true;
        }else{  player.sprite.flipped = false;}
    })

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player1);
        renderEntity(player2);
    }

    renderEntities(player1.shots);
    renderEntities(player2.shots);
    renderEntities(enemies);
    renderEntities(explosions);
};

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        ctx.save();
        ctx.translate(list[i].pos[0], list[i].pos[1]);
        //  this will check if enough time has passed before rendering shot
        if(Date.now() - list[i].fireTime > shotChargeTime){
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
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 0;
    score = 0;

    enemies = [];
    bullets = [];

    player1.pos = [50, canvas.height - groundHeight];
    player2.pos = [canvas.width - 50, canvas.height - groundHeight];
};