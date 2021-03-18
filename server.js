const express = require('express');
const app = express();
const server = require('http').Server(app);
//const io = require('socket.io')(server);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

const cors = require('cors');
const port = process.env.PORT || 9000;
const index = require('./routes/index');

app.use(cors());
app.use(index);


let interval;

io.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const getApiAndEmit = socket => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

server.listen(port, () => console.log(`Listening on port ${port}`));