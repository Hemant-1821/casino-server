const express = require("express");
const app = express();
const mongoose = require("mongoose");
const http = require("http");
const dotenv = require("dotenv");
const server = http.createServer(app);
var bodyParser = require("body-parser");
var cors = require("cors");

// Models
const User = require("./models/User");
const Room = require("./models/Room");

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FE_URL,
    methods: ["GET", "POST"],
  },
});

dotenv.config();

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);

//middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.get("/", (req, res) => {
  console.log("hello");
});

app.post("/register", async (req, res) => {
  try {
    //create new user
    const newUser = new User({
      name: req.body.name,
      phoneNumber: req.body.phone,
      email: req.body.email,
      password: req.body.password,
      isAdmin: false,
    });
    //save user and respond
    const user = await newUser.save();
    console.log("user", user);
    res.json({ resCode: 200, user });
  } catch (err) {
    res.json(err);
  }
});
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.json({ resCode: 404, errDesc: "User not found" });
    const validPassword = req.body.password === user.password;
    !validPassword && res.json({ resCode: 404, errDesc: "Wrong password" });
    user && validPassword && res.json({ resCode: 200, user, errDesc: "" });
  } catch (err) {
    res.json(err);
  }
});

var roomName = "";
io.on("connection", (socket) => {
  socket.on("join-room", async (args) => {
    roomName = args.room;
    const RoomInfo = await Room.findOne({
      status: true,
      name: args.room,
    }).exec();
    if (!RoomInfo) {
      console.log("no room found, creating...");
      const NewRoom = new Room({
        RoomId: "123",
        name: args.room,
        users: { [args.id]: socket.id },
        status: true,
      });
      const room = await NewRoom.save();
      if (room) {
        socket.join(room.name);
        roomName = room.name;
        io.to(room.name).emit("roomMessage", "Hello you are in a room");
        var socketRoom = io.sockets.adapter.rooms;
        io.to(room.name).emit(
          "roomMembersCount",
          socketRoom.get(room.name).size
        );
        console.log("104 Rooms", socketRoom);
      }
    } else {
      if (Object.keys(RoomInfo.users).length < 3) {
        const updatedUsers = { ...RoomInfo.users, [args.id]: socket.id };
        const updatedRoom = await Room.findOneAndUpdate(
          { _id: RoomInfo._id },
          { users: updatedUsers }
        );
        socket.join(updatedRoom.name);
        roomName = updatedRoom.name;
        io.to(updatedRoom.name).emit("roomMessage", "Hello you are in a room");
        var socketRoom = io.sockets.adapter.rooms;
        io.to(updatedRoom.name).emit(
          "roomMembersCount",
          socketRoom.get(updatedRoom.name).size
        );
        console.log("121 Rooms", socketRoom);
      } else {
        throw new Error("Full!");
      }
    }
  });
  User.watch().on("change", (change) => {
    console.log("Something has changed", change);
    io.emit("changes", change.updateDescription);
  });
  socket.on("disconnect", async function () {
    console.log("Got disconnect!", socket.id, "Room Name", roomName);
    const RoomInfo = await Room.findOne({
      status: true,
      name: roomName,
    }).exec();
    console.log("150 Room info", RoomInfo);
    if (RoomInfo) {
      const roomUsersKey = Object.keys(RoomInfo.users);
      const roomUsersVal = Object.values(RoomInfo.users);
      const newUsersObj = {};
      if (roomUsersVal.includes(socket.id)) {
        roomUsersKey.forEach((userId) => {
          if (RoomInfo.users[userId] !== socket.id) {
            newUsersObj[userId] = RoomInfo.users[userId];
          }
        });
        console.log("newUserObj 157", newUsersObj);
        const updatedRoom = await Room.findOneAndUpdate(
          { _id: RoomInfo._id },
          { users: { ...newUsersObj } }
        );
        var socketRoom = io.sockets.adapter.rooms;
        io.to(updatedRoom.name).emit(
          "roomMembersCount",
          socketRoom.get(updatedRoom.name).size
        );
      }
    }
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log("listening on *:5000");
});
