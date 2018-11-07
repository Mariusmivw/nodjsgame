const socket = io();

socket.on("ok lol", function () {
    socket.emit("data", { hello: 6 });
});

socket.on("data", function (data) {
    console.log(data);
});

socket.on("left room", () => {
    console.log("left");
    socket.emit("leave room");
});

socket.on("room found", () => {
    console.log("yay");
});