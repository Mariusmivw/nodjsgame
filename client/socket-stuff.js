const socket = io();

socket.on("pw", function (data) {
	key = data;
});

socket.on("ok lol", function () {
	socket.emit("data", {
		newBullets: getBulletData(),
		tankData: {
			x: player.x,
			y: player.y,
			orientation: player.orientation
		}
	});
	newBullets = false;
});

socket.on("data", function (data) {
	if (data.newBullets.length) {
		// console.log("oui");
		for (let bullet of data.newBullets) {
			enemyBullets.push(
				new Bullet(
					bullet.x,
					bullet.y,
					0,
					bullet.speed,
					bullet.lifeSpan,
					true,
					bullet.xv,
					bullet.yv
				)
			);
		}
	}
	enemy.x = data.tankData.x;
	enemy.y = data.tankData.y;
	enemy.orientation = data.tankData.orientation;
});

socket.on("left room", () => {
	console.log("Opponent left");
	socket.emit("leave room");
});

socket.on("room found", () => {
	console.log("yay");
});

const getBulletData = () => {
	let newBullets = [];
	for (let bullet of bullets) {
		if (bullet.isNewBullet) {
			newBullets.push({
				x: bullet.x,
				y: bullet.y,
				speed: bullet.speed,
				xv: bullet.xv,
				yv: bullet.yv,
				lifeSpan: bullet.lifeSpan
			});
			bullet.isNewBullet = false;
		}
	}
	return newBullets;
}