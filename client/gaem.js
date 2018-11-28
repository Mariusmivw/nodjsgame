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

let mapWidth = xSize / (vertMap[0].length + 1);
let mapHeight = xSize / (vertMap[0].length + 1);

function setup() {
    createCanvas(xSize, ySize);
    background(255);
    player = new Tank(xSize / 2, ySize / 2, 0.3, 3);
    enemy = new Enemy();
    rectMode(CENTER);
    stroke(0);
    strokeWeight(1);
    frameRate(15);
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
        if (this.x < this.size / 2 || this.x > xSize - this.size / 2) {
            this.xv = -this.xv;
        }

        if (this.y < this.size / 2 || this.y > ySize - this.size / 2) {
            this.yv = -this.yv;
        }
        //collision with the map
        for (let i = 0; i < horiMap.length; i++) {
            const row = horiMap[i];
            for (let j = 0; j < row.length; j++) {
                const isLine = row[j];
                if (isLine) {
                    if (row[j - 1] !== false &&
                        collidePointCircle(
                            (j) * mapWidth,
                            (i + 1) * mapHeight,
                            this.x,
                            this.y,
                            this.size
                        ) &&
                        (j) * mapWidth - this.x < abs((i + 1) * mapHeight - this.y)) {
                        this.xv *= -1;
                    } else if (row[j + 1] !== false &&
                        collidePointCircle(
                            (j + 1) * mapWidth,
                            (i + 1) * mapHeight,
                            this.x,
                            this.y,
                            this.size
                        ) && (j + 1) * mapWidth - this.x < -abs((i + 1) * mapHeight - this.y)) {
                        this.xv *= -1;
                    }
                    if (collideLineCircle(
                            (j) * mapWidth,
                            (i + 1) * mapHeight,
                            (j + 1) * mapWidth,
                            (i + 1) * mapHeight,
                            this.x,
                            this.y,
                            this.size
                        )) {
                        this.yv *= -1;
                        break;
                    }

                }
            }
        }
        for (let i = 0; i < vertMap.length; i++) {
            const column = vertMap[i];
            for (let j = 0; j < column.length; j++) {
                const isLine = column[j];
                if (isLine) {
                    if (column[j - 1] && collidePointCircle(
                            (j + 1) * mapWidth,
                            (i - 0) * mapHeight,
                            this.x,
                            this.y,
                            this.size
                        )) {
                        this.yv *= -1;
                    } else if (column[j + 1] && collidePointCircle(
                            (j + 1) * mapWidth,
                            (i + 1) * mapHeight,
                            this.x,
                            this.y,
                            this.size
                        )) {
                        this.yv *= -1;
                    } else if (collideLineCircle(
                            (j + 1) * mapWidth,
                            (i - 0) * mapHeight,
                            (j + 1) * mapWidth,
                            (i + 1) * mapHeight,
                            this.x,
                            this.y,
                            this.size
                        )) {
                        this.xv *= -1;
                        break;
                    }

                }
            }
        }

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
    rect(1, 1, horiMap[0].length * mapWidth - 2, vertMap.length * mapHeight - 1);

    for (let i = 0; i < vertMap.length; i++) {
        for (let j = 0; j < vertMap[i].length; j++) {
            if (vertMap[i][j]) {
                line(
                    (j + 1) * mapWidth,
                    (i - 0) * mapHeight,
                    (j + 1) * mapWidth,
                    (i + 1) * mapHeight
                );
            }
        }
    }

    for (let i = 0; i < horiMap.length; i++) {
        for (let j = 0; j < horiMap[i].length; j++) {
            if (horiMap[i][j]) {
                line(
                    (j) * mapWidth,
                    (i + 1) * mapHeight,
                    (j + 1) * mapWidth,
                    (i + 1) * mapHeight
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
