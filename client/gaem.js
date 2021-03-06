const xSize = 600;
const ySize = 600;
const shootCooldown = 30;
let player;
let enemy;
let bullets = [];
let enemyBullets = [];
let newBullets = false;

let vertMap = [
    [false, true, false, false, true],
    [false, false, false, true, false],
    [false, true, false, true, false],
    [false, true, false, true, true]
];

let horiMap = [
    [true, true, true, true, true, false],
    [false, true, true, false, true, true],
    [false, true, true, false, true, false]
];

let wallSpacing = Math.min(xSize / horiMap[0].length, ySize / vertMap.length);

function setup() {
    createCanvas(xSize, ySize);
    background(255);
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
        let LEFT = (keyIsDown(LEFT_ARROW) || keyIsDown(65)) == true;
        let RIGHT = (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) == true;
        let UP = (keyIsDown(UP_ARROW) || keyIsDown(87)) == true;
        let DOWN = (keyIsDown(DOWN_ARROW) || keyIsDown(83)) == true;

        if (LEFT) {
            this.orientation = (TAU + this.orientation - (PI / 180) * 3) % TAU;
        }

        if (RIGHT) {
            this.orientation = (TAU + this.orientation + (PI / 180) * 3) % TAU;
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
        let FIRE = (keyIsDown(32) || keyIsDown(77) || keyIsDown(67)) == true; // Spacebar - M - C
        this.currentShootCooldown =
            this.currentShootCooldown > 0 ? this.currentShootCooldown - 1 : 0;
        if (FIRE && this.currentShootCooldown == 0) {
            this.currentShootCooldown = shootCooldown;
            let b = new Bullet(this.x, this.y, this.orientation, 3);
            bullets.push(b);
            // console.log(bullets);
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
    }
}

class Bullet {
    constructor(
        _x,
        _y,
        _orientation,
        _speed,
        _lifeSpan = 60 * 4,
        _enemyBullet = false,
        _xv = undefined,
        _yv = undefined
    ) {
        // starting in the player tank
        this.x = _x;
        this.y = _y;
        // giving the bullet a speed
        this.speed = _speed;

        if (!_xv) {
            //calculating the x and the y components of the bullet's speed
            this.xv = -sin(-_orientation) * this.speed;
            this.yv = -cos(-_orientation) * this.speed;
        } else {
            this.xv = _xv;
            this.yv = _yv;
        }

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

        //collision with the edge of the map
        if (this.x < this.size / 2 || this.x > wallSpacing * horiMap[0].length - this.size / 2) {
            this.xv = -this.xv;
        }
        if (this.y < this.size / 2 || this.y > wallSpacing * vertMap.length - this.size / 2) {
            this.yv = -this.yv;
        }

        //collision with the map
        collideHoriMap(this.x, this.y, this.size, (collideLeft, collideRight, collideWall) => {
            if (collideLeft || collideRight) {
                this.xv *= -1;
            } else if (collideWall) {
                this.yv *= -1;
            }
        });
        collideVertMap(this.x, this.y, this.size, (collideUp, collideDown, collideWall) => {
            if (collideUp || collideDown) {
                this.yv *= -1;
            } else if (collideWall) {
                this.xv *= -1;
            }
        });

        //collision with the player
        if (
            distance(
                player.x,
                player.y,
                this.x,
                this.y,
                player.size / 2,
                this.size / 2
            )
        ) {
            if (this.left) {
                player.hit = true;
            }
        } else {
            this.left = true;
        }
        if (
            distance(enemy.x, enemy.y, this.x, this.y, enemy.size / 2, this.size / 2)
        ) {
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

    update() {}
}

// distance check
function distance(x1, y1, x2, y2, r1, r2) {
    let x = x2 - x1,
        y = y2 - y1,
        dist = Math.sqrt(x * x + y * y),
        collision = false;

    // check the distance against the sum of both objects radius. If its less its a hit
    if (dist < r1 + r2) {
        collision = true;
    }

    return collision;
}

function collideHoriMap(x, y, r, callback) {
    for (let i = 0; i < horiMap.length; i++) {
        const row = horiMap[i];
        let shouldBreak = false;
        for (let j = 0; j < row.length; j++) {
            const isLine = row[j];
            if (isLine) {
                if (!row[j - 1] && collidePointCircle((j + 0) * wallSpacing, (i + 1) * wallSpacing, x, y, r) && (j + 0) * wallSpacing - x > abs((i + 1) * wallSpacing - y)) {
                    if (!VertMap(i, j - 1) && !VertMap(i + 1, j - 1)) {
                        callback(true, false, false);
                    }
                } else if (!row[j + 1] && collidePointCircle((j + 1) * wallSpacing, (i + 1) * wallSpacing, x, y, r) && (j + 1) * wallSpacing - x < -abs((i + 1) * wallSpacing - y)) {
                    if (!VertMap(i, j) && !VertMap(i + 1, j)) {
                        callback(false, true, false);
                    }
                } else if (collideLineCircle((j + 0) * wallSpacing, (i + 1) * wallSpacing, (j + 1) * wallSpacing, (i + 1) * wallSpacing, x, y, r)) {
                    callback(false, false, true);
                    shouldBreak = true;
                    break;
                }
            }
        }
        if (shouldBreak) {
            break;
        }
    }
}

function collideVertMap(x, y, r, callback) {
    for (let i = 0; i < vertMap.length; i++) {
        const column = vertMap[i];
        let shouldBreak = false;
        for (let j = 0; j < column.length; j++) {
            const isLine = column[j];
            if (isLine) {
                if (!column[j - 1] && collidePointCircle((j + 1) * wallSpacing, (i + 0) * wallSpacing, x, y, r)) {
                    if (!HoriMap(i - 1, j) && !HoriMap(i - 1, j + 1)) {
                        callback(true, false, false);
                    }
                } else if (!column[j + 1] && collidePointCircle((j + 1) * wallSpacing, (i + 1) * wallSpacing, x, y, r)) {
                    if (!HoriMap(i, j) && !HoriMap(i, j + 1)) {
                        callback(false, true, false);
                    }
                } else if (collideLineCircle((j + 1) * wallSpacing, (i + 0) * wallSpacing, (j + 1) * wallSpacing, (i + 1) * wallSpacing, x, y, r)) {
                    callback(false, false, true);
                    shouldBreak = true;
                    break;
                }
            }
        }
        if (shouldBreak) {
            break;
        }
    }
}

function HoriMap(x, y) {
    try {
        return horiMap[x][y];
    } catch (e) {
        return undefined;
    }
}

function VertMap(x, y) {
    try {
        return vertMap[x][y];
    } catch (e) {
        return undefined;
    }
}

function draw() {
    if (player.hit) {
        background(255, 100, 100);
        player.hit = false;
    } else {
        background(255);
    }

    push();
    noFill();
    strokeWeight(2);
    rectMode(CORNER);
    rect(1, 1, horiMap[0].length * wallSpacing - 2, vertMap.length * wallSpacing - 1);

    for (let i = 0; i < vertMap.length; i++) {
        for (let j = 0; j < vertMap[i].length; j++) {
            if (vertMap[i][j]) {
                line(
                    (j + 1) * wallSpacing,
                    (i - 0) * wallSpacing,
                    (j + 1) * wallSpacing,
                    (i + 1) * wallSpacing
                );
            }
        }
    }

    for (let i = 0; i < horiMap.length; i++) {
        for (let j = 0; j < horiMap[i].length; j++) {
            if (horiMap[i][j]) {
                line(
                    (j) * wallSpacing,
                    (i + 1) * wallSpacing,
                    (j + 1) * wallSpacing,
                    (i + 1) * wallSpacing
                );
            }
        }
    }
    pop();

    for (let i = 0; i < bullets.length; i++) {
        bullets[i].update();
        bullets[i].draw();
    }

    for (let i = 0; i < enemyBullets.length; i++) {
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