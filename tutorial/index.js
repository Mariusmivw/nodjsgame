require("dotenv").config();

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 8000;

app.get('/', function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
	socket.broadcast.emit("chat message", "A user connected");
	
	socket.on("disconnect", function() {
		socket.broadcast.emit("chat message", "A user disconnected");
	});
	
	socket.on("chat message", function (msg) {
		console.log("message: " + msg);
		// io.emit("chat message", msg); // everyone including sender
		socket.broadcast.emit("chat message", msg); // everyone excluding sender
	});

	// template
	// socket.on("{event name}", function ({parameters}) {
		// thing to do
	// });
});

http.listen(PORT, function() {
	console.log(`listening on port: ${PORT}`);
});