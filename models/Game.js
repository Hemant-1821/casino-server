const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  userId: String,
  color: String,
  number: String,
  colorAmt: String,
  numberAmt: String,
});
const roomsSchema = new mongoose.Schema({
  CCON: [roomSchema],
  DICOR: [roomSchema],
  POLA: [roomSchema],
  GRASY: [roomSchema],
});

const gameSchema = new mongoose.Schema({
  refNo: String,
  // rooms: Object,
  rooms: roomsSchema,
});

module.exports = mongoose.model("Game", gameSchema);
