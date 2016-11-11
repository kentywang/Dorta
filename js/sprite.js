function Sprite(url, pos, size, boxpos, boxsize, speed, frames, dir, once) {
    this.state;
    this.flipped = false;

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
    this.resetFrame = false;    // do I even need this?
};

Sprite.prototype.update = function(dt) {
     switch(this.state){
        case ("moving"):
            this.url = "img/shot.png";
            this.pos = [64 * 4, 0];
            this.frames = [0, 1, 2, 3];
        case ("hit"):
            this.url = "img/shot.png";
            this.pos = [64 * 4, 64 * 2];
            this.frames = [0, 1, 2, 3];
        default:
            this.url = "img/shot.png";
            this.state = "moving";
            this.pos = [64 * 4, 0];
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
        // if(idx >= max) {    // these are the actions that cannot be interrupted once begun and reset to idle after completion
        //     if(this.state === "supershot" || this.state === "kick"){
        //         this.state = "idle";
        //     }
        //     this._index = 0;
        // }
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
    if(this.flipped){
        ctx.scale(-1, 1);
        ctx.drawImage(resources.get(this.url),
                  x, y,
                  this.size[0], this.size[1],
                  0, 0,
                  this.size[0], this.size[1]);
        ctx.restore();
    }
    else{
        ctx.drawImage(resources.get(this.url),
                  x, y,
                  this.size[0], this.size[1],
                  0, 0,
                  this.size[0], this.size[1]);
    }
}


function PlayerSprite(url, pos, size, boxpos, boxsize, speed, frames, dir, once) {
    this.state;

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
    this.resetFrame = false;    // do I even need this?
};

PlayerSprite.prototype.update = function(dt) {
    switch(this.state){
        case "walk":
            this.url = "img/cat.png";
            this.pos = [0, 64];
            this.frames = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
            break;
        case "crouch":
            this.url = "img/cat.png";
            this.pos = [0, 64*7];
            this.frames = [2];
            break;
        case "jump":
            this.url = "img/cat.png";
            this.pos = [0, 64*2];
            this.frames = [2, 3];
            break;
        case "jump2":
            this.url = "img/cat.png";
            this.pos = [0, 64*3];
            this.frames = [3, 4, 5, 6];
            this.speed *= 1.5;
            break;
        case "punch":
            this.url = "img/cat.png";
            this.pos = [0, 64*9];
            this.frames = [4, 5, 7, 8];
            break;
        case "uppercut":
            this.url = "img/cat.png";
            this.pos = [0, 64*8];
            this.frames = [6, 7];
            break;
        case "downkick":
            this.url = "img/cat.png";
            this.pos = [0, 64*3];
            this.frames = [8];
            break;
        case "sidekick":
            this.url = "img/cat.png";
            this.pos = [0, 64*10];
            this.frames = [2, 3];
            break;
        case "airkick":
            this.url = "img/cat.png";
            this.pos = [0, 64*7];
            this.frames = [5, 6];
            break;
        case "kick":
            this.url = "img/cat.png";
            this.pos = [0, 64*11];
            this.speed = 3;
            this.frames = [2, 3];
            break;
        case "supershot":
            this.url = "img/cat2.png"
            this.pos = [0, 64*0];
            this.frames = [0, 1, 2, 3, 4, 5, 6, 7, 8]  //  , 9, 10];
            this.speed *= 1.5;
            break;
        default:
            this.url = "img/cat.png";
            this.state = "idle";
            this.pos = [0, 0];
            this.frames = [0, 1, 2, 3];
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
            if(this.state === "supershot" || this.state === "kick"){
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
    if(this.flipped){
        ctx.scale(-1, 1);
        ctx.drawImage(resources.get(this.url),
                  x, y,
                  this.size[0], this.size[1],
                  0, 0,
                  this.size[0], this.size[1]);
        ctx.restore();
    }else{
        ctx.drawImage(resources.get(this.url),
                  x, y,
                  this.size[0], this.size[1],
                  0, 0,
                  this.size[0], this.size[1]);
    }
}