// const express = require('express')
// const app = express()
// const server = require('http').Server(app)
// const io = require('socket.io')(server)
// const { v4: uuidV4 } = require('uuid')

// app.set('view engine', 'ejs')
// app.use(express.static('public'))

// app.get('/', (req, res) => {
//   res.redirect(`/${uuidV4()}`)
// })

// app.get('/:room', (req, res) => {
//   res.render('room', { roomId: req.params.room })
// })

// io.on('connection', socket => {
//   socket.on('join-room', (roomId, userId) => {
//     socket.join(roomId)
//     socket.to(roomId).broadcast.emit('user-connected', userId)

//     socket.on('disconnect', () => {
//       socket.to(roomId).broadcast.emit('user-disconnected', userId)
//     })
//   })
// })

// server.listen(3000)


// zoom-backend/index.js
// server.js
const socketIo = require("socket.io"); 
const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];

    const isInitiator = rooms[roomId].length === 0;
    rooms[roomId].push(socket.id);

    socket.join(roomId);
    socket.emit("joined-room", { initiator: isInitiator });

    // Notify others
    rooms[roomId].forEach((id) => {
      if (id !== socket.id) {
        io.to(id).emit("user-joined", socket.id);
      }
    });

    socket.on("signal", ({ to, from, data }) => {
      io.to(to).emit("signal", { from, data });
    });

    socket.on("disconnect", () => {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      io.to(roomId).emit("user-left", socket.id);
    });
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
