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
    'img/parallax-forest-lights.png',
    'img/parallax-forest-back-trees.png',
    'img/parallax-forest-middle-trees.png',
    'img/parallax-forest-front-trees.png'
]);
resources.onReady(init);


// Game state
var player1 = {
    pos: [0, 0],
    velocityY: 0,
    velocityX: 0,
    sprite: new Sprite('img/cat.png', [0, 0], [64, 64], [25, 26], [12, 28], 6, [0, 1, 2, 3])
};

var bullets = [];
var enemies = [];
var explosions = [];

var lastFire = Date.now();
var gameTime = 0;
var isGameOver;
var terrainPattern;

// The score
var score = 0;
var scoreEl = document.getElementById('score');

// Speed in pixels per second
var player1Speed = 70;
var bulletSpeed = 500;
var enemySpeed = 50;

// Physics
var player1Jump = -300;
var gravityAccelerationY = 800;


// Update game objects
function update(dt) {
    gameTime += dt;

    handleInput(dt);
    processPhysics(dt);
    updateEntities(dt);

    // It gets harder over time by adding enemies using this
    // equation: 1-.993^gameTime
    if(Math.random() < .01) {
        enemies.push({
            pos: [canvas.width,
                  Math.random() * canvas.height - 32],
            sprite: new Sprite('img/cat.png', [0, 0], [64, 64], [25, 26], [12,28], 6, [0, 1, 2, 3])
        });
    }

    checkCollisions();

    scoreEl.innerHTML = score;
};


function handleInput(dt) {
    if(player1.sprite.state !== "jump"){ // TEMP+RARILY EDITED
        player1.sprite.state = "idle";

        if(input.isDown('DOWN')) {
            // player1.sprite.state = "walk";
            // player1.pos[1] += player1Speed * dt;
        }

        else if(input.isDown('SPACE') && input.isDown('LEFT')) {
            player1.sprite.state = "jump";
            player1.velocityY = player1Jump;
            player1.velocityX = player1Jump/4;
            //player1.pos[0] -= player1Speed * dt;
        }

        else if(input.isDown('SPACE') && input.isDown('RIGHT')) {
            player1.sprite.state = "jump";
            player1.velocityY = player1Jump;
            player1.velocityX = -player1Jump/4;
            //player1.pos[0] += player1Speed * dt;
        }

        else if(input.isDown('SPACE')) {
            player1.sprite.state = "jump";
            player1.velocityY = player1Jump;
        }

        else if(input.isDown('LEFT')) {
            player1.sprite.state = "walk";
            player1.pos[0] -= player1Speed * dt;    
        }

        else if(input.isDown('RIGHT')) {
            player1.sprite.state = "walk";
            player1.pos[0] += player1Speed * dt;
        }
    }
        console.log(player1.sprite.state)

    // if(input.isDown('UP') &&
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
    player1.velocityY += gravityAccelerationY * dt;
    player1.pos[1] += player1.velocityY * dt;
    player1.pos[0] += player1.velocityX * dt;
    // if (player1.pos[1] > 0) {
    //     positionY = 0; // assuming the ground is at height 0
    //     velocityY = 0;
    // }
}

function updateEntities(dt) {
    // Update the player sprite animation
    player1.sprite.update(dt);

    // // Update all the bullets
    // for(var i=0; i<bullets.length; i++) {
    //     var bullet = bullets[i];

    //     switch(bullet.dir) {
    //     case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
    //     case 'down': bullet.pos[1] += bulletSpeed * dt; break;
    //     default:
    //         bullet.pos[0] += bulletSpeed * dt;
    //     }

    //     // Remove the bullet if it goes offscreen
    //     if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
    //        bullet.pos[0] > canvas.width) {
    //         bullets.splice(i, 1);
    //         i--;
    //     }
    // }

    // Update all the enemies
    for(var i=0; i<enemies.length; i++) {
        enemies[i].pos[0] -= enemySpeed * dt;
        enemies[i].sprite.update(dt);

        // Remove if offscreen
        if(enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
            enemies.splice(i, 1);
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
//var f= false
function checkCollisions() {
    checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    // Factor in hitbox size
    for(var i=0; i<enemies.length; i++) {
        var pos = [enemies[i].pos[0] + enemies[i].sprite.boxpos[0], enemies[i].pos[1] + enemies[i].sprite.boxpos[1]];
        var size = enemies[i].sprite.boxsize;

        var p1pos = [player1.pos[0] + player1.sprite.boxpos[0], player1.pos[1] + player1.sprite.boxpos[1]];
        var p1size = player1.sprite.boxsize;

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
}

function checkPlayerBounds() {
    // Check side bounds (enforce at hitbox)
    if(player1.pos[0]  < - player1.sprite.boxpos[0]) {
        player1.velocityX = 0;  // may want to change this to get bouncing
        player1.pos[0] = - player1.sprite.boxpos[0];
    }
    else if(player1.pos[0] > canvas.width - player1.sprite.boxpos[0] - player1.sprite.boxsize[0]) {
        player1.velocityX = 0;  // may want to change this to get bouncing
        player1.pos[0] = canvas.width - player1.sprite.boxpos[0] - player1.sprite.boxsize[0];
    }

    // Check top and lower bounds
    if(player1.pos[1]  < - player1.sprite.boxpos[1]) {
        player1.velocityY = 0;  // may want to change this to get bouncing
        player1.pos[1] = - player1.sprite.boxpos[1];
    }
    else if(player1.pos[1] > canvas.height - player1.sprite.boxpos[1] - player1.sprite.boxsize[1]) {
        player1.velocityY = 0;
        player1.velocityX = 0;
        player1.sprite.state = "idle";
        player1.pos[1] = canvas.height - player1.sprite.boxpos[1] - player1.sprite.boxsize[1];
    }
}


// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player1);
    }

    renderEntities(bullets);
    renderEntities(enemies);
    renderEntities(explosions);
};

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        renderEntity(list[i], true);
    }    
}

function renderEntity(entity, flipped) {
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

    player1.pos = [50, canvas.height];
};