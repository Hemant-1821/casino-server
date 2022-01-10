const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    RoomId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    users: {
      type: Object,
      require: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
