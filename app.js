var express = require('express');
var app = express();
var server = require('http').createServer(app);
const path = require('path');
var io = require('socket.io').listen(server);


var port = process.env.PORT || 8000;

app.use("/js", express.static(__dirname + "/js"));
app.use("/audio", express.static(__dirname + "/audio"));
app.use("/css", express.static(__dirname + "/css"));
app.use("/img", express.static(__dirname + "/img"));

app.get('/', function (req, res) {
    res.sendFile(path.join(path.join(__dirname, './'), './index.html'));
});

app.listen(port, function() {
    console.log("App is running on port " + port);
});