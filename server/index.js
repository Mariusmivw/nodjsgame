require("dotenv").config();

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 8000;

var queue = [];    // list of sockets waiting for peers
var rooms = {};    // map socket.id => room
var allUsers = {}; // map socket.id => socket


app.get("/", function (req, res) {
	var path = require("path");
	res.sendFile(path.join(__dirname, "../client", "index.html"));
	app.use(require("express").static(path.join(__dirname, "../client"))); // otherwise you get a mime-type error if in different folder
});

var findPeerForLoneSocket = function (socket) {
	// this is place for possibly some extensive logic
	// which can involve preventing two people pairing multiple times
	if (queue.length) {
		// somebody is in queue, pair them!
		var peer = queue.pop();
		var room = socket.id + "#" + peer.id;
		// join them both
		peer.join(room);
		socket.join(room);
		// register rooms to their names
		rooms[peer.id] = room;
		rooms[socket.id] = room;
		// exchange names between the two of them and start the chat
		peer.emit("connection start", { "room": room, "peer": peer.id });
		socket.emit("connection start", { "room": room, "peer": peer.id });
	} else {
		// queue is empty, add our lone socket
		queue.push(socket);
	}
}

io.on("connection", function (socket) {
	// code to do when someone connects
	console.log("User " + socket.id + " connected");

	socket.on("login", function () {
		allUsers[socket.id] = socket;
		// now check if sb is in queue
		findPeerForLoneSocket(socket);
	});

	socket.on("poll position", function () {
		var room = rooms[socket.id];
		socket.broadcast.to(room).emit("poll position");
	});

	socket.on("send position", function (data) {
		var room = rooms[socket.id];
		socket.broadcast.to(room).emit("send position", data);
	});

	socket.on("shoot bullet", function (data) {
		var room = rooms[socket.id];
		socket.broadcast.to(room).emit("shoot bullet", data);
	});

	socket.on("orientation change", function (data) {
		var room = rooms[socket.id];
		socket.broadcast.to(room).emit("orientation change", data);
	});

	socket.on("speed change", function (data) {
		var room = rooms[socket.id];
		socket.broadcast.to(room).emit("speed change", data);
	});

	socket.on("leave room", function () {
		var room = rooms[socket.id];
		socket.broadcast.to(room).emit("connection end");
		var peerID = room.split("#");
		peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];

		socket.leave(room);
		allUsers[peerID].leave(room);
		// add both current and peer to the queue
		findPeerForLoneSocket(allUsers[peerID]);
		findPeerForLoneSocket(socket);
	});

	socket.on("disconnect", function () {
		var room = rooms[socket.id];
		if (room) {
			socket.broadcast.to(room).emit("connection end");
			var peerID = room.split("#");
			peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];
			// current socket left, add the other one to the queue
			findPeerForLoneSocket(allUsers[peerID]);
		}
	});
});

http.listen(PORT, function () {
	console.log(`listening on port: ${PORT}`);
});