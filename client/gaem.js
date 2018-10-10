const xSize = 600;
const ySize = 600;
var player;
var enemy;

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
    enemy = new Enemy();
}

class Tank {
    constructor(_x, _y, _acc, _ms) {
        this.x = _x;
        this.y = _y;
        this.acc = _acc;
        this.maxSpeed = _ms;
        this.xv = 0;
        this.yv = 0;
        this.speed = 0;
        this.orientation = 0;
    }

    update() {
        // controlling the tank
        var LEFT = (keyIsDown(LEFT_ARROW) || keyIsDown(65))==true;
        var RIGHT = (keyIsDown(RIGHT_ARROW) || keyIsDown(68))==true;
        var UP = (keyIsDown(UP_ARROW) || keyIsDown(87))==true;
        var DOWN = (keyIsDown(DOWN_ARROW) || keyIsDown(83))==true;

        if (LEFT) {
            this.orientation -= PI / 180 * 3;
        }
        
        if (RIGHT) {
            this.orientation += PI / 180 * 3;
        }

        if (UP) {
            // this.yv -= this.acc;
            this.speed = 4;
        }
        
        if (DOWN) {
            // this.yv += this.acc;
            this.speed = -4;
        }


        // ==true so undefined and false return false

        if (UP == DOWN) {
            this.speed = 0;
        }

        // making sure x velocity won't go above 3, or below -3
        if (this.xv > this.maxSpeed) {
            this.xv = this.maxSpeed;
        } else if (this.xv < -this.maxSpeed) {
            this.xv = -this.maxSpeed;
        }

        // making sure y velocity won't go above 3, or below -3
        if (this.yv > this.maxSpeed) {
            this.yv = this.maxSpeed;
        } else if (this.yv < -this.maxSpeed) {
            this.yv = -this.maxSpeed;
        }

        // updating x and y position
        // this.x += this.xv;
        // this.y += this.yv;
        this.x += this.speed * -sin(-this.orientation);
        this.y += this.speed * -cos(-this.orientation);
    }

    draw() {
        push();
        // set origin point at tank position
        translate(this.x, this.y);
        // rotate so the tank will be rotated
        rotate(this.orientation);

        rectMode(CENTER);
        stroke(0);
        strokeWeight(1);
        rect(0, 0, 10, 10);
        rect(0, -5, 3, 8);
        pop();
    }
}

class Enemy {
    update() {

    }
}

function draw() {
    background(175);
    player.update();
    player.draw();
}

const socket = io();
socket.on("directionChange", () => {
// enemy.direction
});