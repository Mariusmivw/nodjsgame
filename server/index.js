require("dotenv").config();

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 8000;


app.get('/', function (req, res) {
	var path = require("path");
	res.sendFile(path.join(__dirname, "../client", "index.html"));
	app.use(require("express").static(path.join(__dirname, "../client"))); // otherwise you get a mime-type error if in different folder
});

io.on("connection", function (socket) {
	// code to do when someone connects

	socket.on("disconnect", function () {
		// code to do when someone disconnects
	});

	// template
	// socket.on("{event name}", function ({parameters}) {
	// thing to do
	// });
});

http.listen(PORT, function () {
	console.log(`listening on port: ${PORT}`);
});