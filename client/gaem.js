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
var newBullets = false;

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

var mapWidth = xSize / vertMap[0].length;

var mapHeight = ySize / horiMap[0].length;

function setup() {
    createCanvas(xSize, ySize);
    background(175);
    player = new Tank(xSize / 2, ySize / 2, 0.3, 3);
    enemy = new Enemy();
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
        this.orientation = 0;
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
            this.orientation = (TAU + this.orientation - (PI / 180 * 3)) % TAU;
        }

        if (RIGHT) {
            this.orientation = (TAU + this.orientation + (PI / 180 * 3)) % TAU;
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
            bullets.push(b);
            console.log(bullets);
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
    constructor(_x, _y, _orientation, _speed, _lifeSpan = 60 * 4, _enemyBullet = false) {
        // starting in the player tank
        this.x = _x;
        this.y = _y;
        // giving the bullet a speed
        this.speed = _speed;
        // giving the right orientation to the bullet
        this.orientation = _orientation % TAU;

        //calculating the x and the y components of the bullet's speed
        this.xv = -sin(-this.orientation) * this.speed;
        this.yv = -cos(-this.orientation) * this.speed;

        console.log(this.orientation);
        console.log(-acos(cos(this.orientation)));
        console.log(-acos(-this.yv / this.speed));

        this.lifeSpan = _lifeSpan;
        this.size = 10;
        this.temp = false;
        this.left = false;

        newBullets = true;
        this.isNewBullet = true;
        this.enemyBullet = _enemyBullet;
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

        if (distance(player.x, player.y, this.x, this.y, player.size / 2, this.size / 2)) {
            if (this.left) {
                player.hit = true;
            }
        } else {
            this.left = true
        }
        if (distance(enemy.x, enemy.y, this.x, this.y, enemy.size / 2, this.size / 2)) {
            if (this.left) {
                enemy.hit = true;
            }
        }
    }

    draw() {
        if (this.lifeSpan <= 0) {
            this.enemyBullet ? enemyBullets.shift() : bullets.shift();
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
    // console.log(player.hit);
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

    for (var i = 0; i < enemyBullets.length; i++) {
        enemyBullets[i].update();
        enemyBullets[i].draw();
    }

    player.update();
    player.draw();

    if (enemy) {
        enemy.update();
        enemy.draw();
    }
}

socket.on("ok lol", function () {
    socket.emit("data", {
        newBullets: getBulletData()
    });
    newBullets = false;
});

socket.on("data", function (data) {
    if (data.newBullets.length) {
        console.log("oui");
        for (let bullet of data.newBullets) {
            enemyBullets.push(new Bullet(bullet.x, bullet.y, bullet.orientation, bullet.speed, bullet.lifeSpan, true));
        }
    }
});

socket.on("left room", () => {
    console.log("left");
    socket.emit("leave room");
});

socket.on("room found", () => {
    console.log("yay");
});

function getBulletData() {
    let newBullets = [];
    for (let bullet of bullets) {
        if (bullet.isNewBullet) {
            newBullets.push({
                x: bullet.x,
                y: bullet.y,
                speed: bullet.speed,
                orientation: -asin(bullet.xv / -bullet.speed),
                lifeSpan: bullet.lifeSpan
            });
            bullet.isNewBullet = false;
        }
    }
    return newBullets;
}