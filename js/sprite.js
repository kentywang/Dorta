function Sprite(url, pos, size, boxpos, boxsize, speed, frames, dir, once) {
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
};

Sprite.prototype.update = function(dt) {
    switch(this.state){
        case "walk":
            this.pos = [0, 64];
            this.frames = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
            break;
        case "jump":
            this.pos = [0, 128];
            this.frames = [2, 3];
            //this.once = true;
            break;
        default:
            this.state = "idle";
            this.pos = [0, 0];
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
            //this.state = "idle";
            return;
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

    ctx.drawImage(resources.get(this.url),
                  x, y,
                  this.size[0], this.size[1],
                  0, 0,
                  this.size[0], this.size[1]);
}