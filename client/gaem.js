const socket = io();
var room = "";
var connected = false;
var peer = "";

const xSize = 600;
const ySize = 600;
const shootCooldown = 30;
var player;
var enemy;
var bullets = [];
var enemyBullets = [];

var vertMap = [
    [false, true, false, false, true],
    [false, false, false, true, false],
    [false, true, false, true, false],
    [false, true, false, true, true]
];

var horiMap = [
    [true, true, true, true, true, false],
    [false, true, true, false, true, true],
    [false, true, true, false, true, false]
];

function setup() {
    createCanvas(xSize, ySize);
    background(175);
    player = new Tank(xSize / 2, ySize / 2, 0.3, 3);
    // enemy = new Enemy();
    rectMode(CENTER);
    stroke(0);
    strokeWeight(1);
}

class Tank {
    constructor(_x, _y, _acc, _ms) {
        this.x = _x;
        this.y = _y;
        this.acc = _acc;
        this.maxSpeed = _ms;
        this.speed = 0;
        this.prevSpeed = 0;
        this.orientation = 0;
        this.prevOrientation = 0;
        this.size = 15;
        this.currentShootCooldown = 0;
        this.hit = false;
    }

    update() {
        // controlling the tank
        var LEFT = (keyIsDown(LEFT_ARROW) || keyIsDown(65)) == true;
        var RIGHT = (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) == true;
        var UP = (keyIsDown(UP_ARROW) || keyIsDown(87)) == true;
        var DOWN = (keyIsDown(DOWN_ARROW) || keyIsDown(83)) == true;

        if (LEFT) {
            this.orientation -= PI / 180 * 3;
        }

        if (RIGHT) {
            this.orientation += PI / 180 * 3;
        }

        if (UP) {
            this.speed += this.acc;
        }

        if (DOWN) {
            this.speed -= this.acc / 1.5;
        }

        if (UP == DOWN) {
            this.speed = 0;
        }

        // making sure y velocity won't go above 3, or below -3
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        } else if (this.speed < -this.maxSpeed / 1.5) {
            this.speed = -this.maxSpeed / 1.5;
        }

        if (this.orientation != this.prevOrientation) {
            socket.emit("orientation change", { "orientation": this.orientation });
        }

        if (this.speed != this.prevSpeed) {
            socket.emit("speed change", { "speed": this.speed });
        }

        this.prevOrientation = this.orientation;
        this.prevSpeed = this.speed;

        // updating x and y position
        this.x += this.speed * -sin(-this.orientation);
        this.y += this.speed * -cos(-this.orientation);

        //collision
        //right
        if (this.x < this.size / 2) {
            this.x = this.size / 2;
        }

        //left
        if (this.x > xSize - this.size / 2) {
            this.x = xSize - this.size / 2;
        }

        //top
        if (this.y < this.size / 2) {
            this.y = this.size / 2;
        }

        //bottom 
        if (this.y > ySize - this.size / 2) {
            this.y = ySize - this.size / 2;
        }

        // shooting
        var FIRE = (keyIsDown(32) || keyIsDown(77) || keyIsDown(67)) == true; // Spacebar - M - C
        this.currentShootCooldown = this.currentShootCooldown > 0 ? this.currentShootCooldown - 1 : 0;
        if (FIRE && this.currentShootCooldown == 0) {
            this.currentShootCooldown = shootCooldown;
            var b = new Bullet(this.x, this.y, this.orientation, 3);
            socket.emit("shoot bullet", { "bullet": b });
            bullets.push(b);
        }
    }

    draw() {
        // pushing so any change to the way the canvas is drawn upon resets at the next pop()
        push();

        // setting origin point at tank position
        translate(this.x, this.y);
        // rotating so the tank will be rotated
        rotate(this.orientation);

        // drawing tank
        rect(0, 0, this.size, this.size);
        rect(0, -this.size / 2, this.size * 0.3, this.size * 0.8);

        pop();
        rect(0, 0, this.size, this.size);
    }
}

class Bullet {
    constructor(_x, _y, _orientation, _speed) {
        // starting in the player tank
        this.x = _x;
        this.y = _y;
        // giving the bullet a speed
        this.speed = _speed;
        // giving the right orientation to the bullet
        this.orientation = _orientation;

        //calculating the x and the y components of the bullet's speed
        this.xv = -sin(-this.orientation) * this.speed;
        this.yv = -cos(-this.orientation) * this.speed;

        this.lifeSpan = 60 * 4;
        this.size = 10;
        this.temp = false;
        this.left = false;
    }

    update() {
        this.x += this.xv;
        this.y += this.yv;
        this.lifeSpan--;

        //collision
        if (this.x < this.size / 2 || this.x > xSize - this.size / 2) {
            this.xv = -this.xv;
        }

        if (this.y < this.size / 2 || this.y > ySize - this.size / 2) {
            this.yv = -this.yv;
        }

        if (distance(player.x, player.y, this.x, this.y, player.size/2, this.size)) {
            if (this.left) {
                player.hit = true;
            }
        } else {
            this.left = true
        }
        if (distance(enemy.x, enemy.y, this.x, this.y, enemy.size / 2, this.size)) {
            if (this.left) {
                enemy.hit = true;
            }
    }

    draw() {
        if (this.lifeSpan <= 0) {
            bullets.shift();
        }
        ellipse(this.x, this.y, this.size, this.size);
    }
}

class Enemy extends Tank {
    constructor(_x, _y) {
        super(_x, _y, 0.3, 3);
    }

    update() {
        this.x += this.speed * -sin(-this.orientation);
        this.y += this.speed * -cos(-this.orientation);

        //collision
        //right
        if (this.x < this.size / 2) {
            this.x = this.size / 2;
        }

        //left
        if (this.x > xSize - this.size / 2) {
            this.x = xSize - this.size / 2;
        }

        //top
        if (this.y < this.size / 2) {
            this.y = this.size / 2;
        }

        //bottom 
        if (this.y > ySize - this.size / 2) {
            this.y = ySize - this.size / 2;
        }
    }
}

// distance check 
function distance(x1, y1, x2, y2, r1, r2) {
    var x = x2 - x1,
        y = y2 - y1,
        dist = Math.sqrt(x * x + y * y),
        collision = false;

    // check the distance against the sum of both objects radius. If its less its a hit
    if (dist < r1 + r2) {
        collision = true;
    }

    return collision;
}

function draw() {
    console.log(player.hit);
    if (player.hit) {
        background(255, 100, 100);
        player.hit = false;
    } else {
        background(175);
    }

    for (var i = 0; i < bullets.length; i++) {
        bullets[i].update();
        bullets[i].draw();
    }

    player.update();
    player.draw();

    if (enemy) {
        enemy.update();
        enemy.draw();
    }

    if (frameCount % (60 * 2.5) == 0) {
        socket.emit("poll position");
    }
}

socket.on("connect", (data) => {
    connected = true;
    socket.emit("login");
});

socket.on("connection start", (data) => {
    peer = data.peer;
    enemy = new Enemy();
    socket.emit("poll position");
    room = data.room;
});

socket.on("connection end", () => {
    peer = "";
    enemy = null;
    room = "";
});

socket.on("orientation change", (data) => {
    if (enemy !== null) {
        enemy.orientation = data.orientation;
    }
});

socket.on("speed change", (data) => {
    if (enemy !== null) {
        enemy.speed = data.speed;
    }
});

socket.on("shoot bullet", (data) => {
    if (enemy !== null) {
        var b = data.bullet;
        bullets.push(new Bullet(b.x, b.y, b.orientation, b.speed));
    }
});

socket.on("poll position", () => {
    socket.emit("send position", { "x": player.x, "y": player.y, "orientation": player.orientation, "speed": player.speed });
});

socket.on("send position", (data) => {
    enemy.x = data.x;
    enemy.y = data.y;
    enemy.orientation = data.orientation;
    enemy.speed = data.speed;
});

socket.on("disconnect", (data) => {

});

var send_message = function (text) {
    if (connected) {
        socket.emit("message", { "text": text });
    }
}

var leave_chat = function () {
    if (connected) {
        socket.emit("leave room");
        room = "";
    }
}