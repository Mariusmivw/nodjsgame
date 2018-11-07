require("dotenv").config();

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 8000;

let socketQueue = [];
let rooms = {};
const peerTimeout = 2000;


app.get("/", function (req, res) {
	var path = require("path");
	res.sendFile(path.join(__dirname, "../client", "index.html"));
	app.use(require("express").static(path.join(__dirname, "../client"))); // otherwise you get a mime-type error if in different folder
});

io.on("connection", function (socket) {
	// code to do when someone connects
	console.log("User " + socket.id + " connected");
	findPeerFor(socket);

	socket.on("data", (data) => {
		// console.log(data);
		socket.emit("ok lol");
		socket.broadcast.emit("data", data);
	});

	socket.on("leave room", () => {
		socket.broadcast.to(rooms[socket.id]).emit("left room");
		socket.leave(rooms[socket.id]);
		rooms[socket.id] = "";
		setTimeout(() => {
			findPeerFor(socket);
		}, peerTimeout);
	});

	socket.on("disconnect", () => {
		socket.broadcast.to(rooms[socket.id]).emit("left room");
		socket.leave(rooms[socket.id]);
		delete rooms[socket.id];
	});
});

http.listen(PORT, function () {
	console.log(`listening on port: ${PORT}`);
});

function findPeerFor(socket) {
	if (socketQueue.length) {
		var peer = socketQueue.pop();
		var room = `${socket.id}#${peer.id}`;

		socket.join(room);
		peer.join(room);

		rooms[socket.id] = room;
		rooms[peer.id] = room;

		io.to(room).emit("room found");
		io.to(room).emit("ok lol");
	} else {
		socketQueue.push(socket);
	}
}