const express = require("express");
const app = express();
const mongoose = require("mongoose");
const http = require("http");
const dotenv = require("dotenv");
const server = http.createServer(app);
var bodyParser = require("body-parser");
const Razorpay = require("razorpay");
var cors = require("cors");

// Models
const User = require("./models/User");
const Room = require("./models/Room");
const Metal = require("./models/Metals");

const io = require("socket.io")(server, {
  cors: {
    origin:
      process.env.ENV === "LOCAL" ? process.env.FE_LOCAL : process.env.FE_PROD,
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

const razorpay = new Razorpay({
  key_id: "rzp_test_Mw3xJon25Hkpmy",
  key_secret: "l5Erzusy8IHDlkn63dKKnlr6",
});

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

app.post("/register", async (req, res) => {
  try {
    //create new user
    const newUser = new User({
      name: req.body.name,
      phoneNumber: req.body.phone,
      email: req.body.email,
      password: req.body.password,
      isAdmin: false,
      wallet: {
        totalAmt: 0,
        transactions: [],
      },
      metals: {
        gold: "0",
        silver: "0",
        platinum: "0",
      },
    });
    //save user and respond
    const user = await newUser.save();
    console.log("user", user);
    res.json({ resCode: 200, user });
  } catch (err) {
    res.json({ resCode: 400, desc: err });
  }
});
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.json({ resCode: 400, errDesc: "User not found" });
    const validPassword = req.body.password === user.password;
    !validPassword && res.json({ resCode: 400, errDesc: "Wrong password" });
    user && validPassword && res.json({ resCode: 200, user, errDesc: "" });
  } catch (err) {
    res.json({ resCode: 400, desc: err });
  }
});
app.post("/razorpay", async (req, res) => {
  var options = {
    amount: (req.body.amt * 100).toString(),
    currency: "INR",
    receipt: "order_rcptid_11",
  };
  try {
    razorpay.orders.create(options, function (err, order) {
      res.json({ resCode: 200, orderId: order.id, desc: "Successfull!" });
    });
  } catch (err) {
    console.log(err);
    res.json({ resCode: 400, desc: "Something went wrong!" });
  }
});

app.post("/verification", async (req, res) => {
  var { paymentResp, userId } = req.body;
  const paymentObj = await razorpay.payments.fetch(
    paymentResp.razorpay_payment_id
  );
  if (paymentObj && paymentObj.status === "captured") {
    const user = await User.findOne({ _id: userId });
    const updatedUser = {
      ...user._doc,
      wallet: {
        totalAmt: user.wallet.totalAmt + paymentObj.amount / 100,
        transactions: [
          ...user.wallet.transactions,
          {
            date: new Date(),
            amt: paymentObj.amount / 100,
            order_id: paymentObj.order_id,
          },
        ],
      },
    };
    await User.findOneAndUpdate({ _id: userId }, updatedUser);
    res.json({ resCode: 200, totalAmt: updatedUser.wallet.totalAmt });
  } else {
    res.json({ resCode: 500, desc: "Not captured!" });
  }
});

app.get("/user", async (req, res) => {
  const userId = req.query.userId;
  try {
    const user = await User.findOne({ _id: userId });
    res.json({ resCode: 200, user });
  } catch (e) {
    console.log(e);
    res.json({ resCode: 404, err: e });
  }
});

app.get("/trading/price", async (req, res) => {
  try {
    const metal = await Metal.findOne({ _id: "61dd2b81aa4e3e518e160c0f" });
    res.json({
      resCode: 200,
      gold: metal.gold,
      silver: metal.silver,
      platinum: metal.platinum,
    });
  } catch (e) {
    console.log(e);
    res.json({ resCode: 400, desc: e });
  }
});

app.post("/trading/price", async (req, res) => {
  const { gold, silver, platinum, userId } = req.body;
  const user = await User.findOne({ _id: userId });
  if (user.isAdmin) {
    try {
      await Metal.findOneAndUpdate(
        { _id: "61dd2b81aa4e3e518e160c0f" },
        { gold, silver, platinum }
      );
      res.json({ resCode: 200, desc: "Successfull!" });
    } catch (e) {
      console.log(e);
      res.json({ resCode: 500, desc: e });
    }
  } else {
    res.json({ resCode: 400, desc: "Not Authorized!" });
  }
});

app.post("/trading/order", async (req, res) => {
  console.log("/trading/order [GET]");
  const { type, metal, rate, weight, userId } = req.body;
  console.log("body", req.body);
  const user = await User.findOne({ _id: userId });
  const rates = await Metal.findOne({ _id: "61dd2b81aa4e3e518e160c0f" });
  if (
    (type === "Buy" && +(rates[metal] * weight) <= +user.wallet.totalAmt) ||
    (type !== "Buy" && +weight <= +user.metals[metal])
  ) {
    try {
      const updatedUser = {
        ...user._doc,
        wallet: {
          totalAmt:
            type === "Buy"
              ? user.wallet.totalAmt - rates[metal] * weight
              : user.wallet.totalAmt + rates[metal] * weight,
          transactions: user.wallet.transactions,
        },
        metals: {
          ...user.metals._doc,
          [metal]:
            type === "Buy"
              ? +user.metals._doc[metal] + +weight
              : +user.metals._doc[metal] - +weight,
        },
      };
      console.log("updatedUser", updatedUser);
      await User.findOneAndUpdate({ _id: userId }, updatedUser);
      res.json({ resCode: 200, user: updatedUser });
    } catch (e) {
      console.log(e);
      res.json({ errCode: 404, desc: e });
    }
  } else {
    res.json({ resCode: 400, desc: "Insufficient Balance!" });
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
      } else {
        throw new Error("Full!");
      }
    }
  });
  socket.on("disconnect", async function () {
    console.log("Got disconnect!", socket.id, "Room Name", roomName);
    const RoomInfo = await Room.findOne({
      status: true,
      name: roomName,
    }).exec();
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
