const mongoose = require("mongoose");

// const RoomInfoSchema = new mongoose.Schema(
//   {
//     _id: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     name: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     users: {
//       type: Array,
//       require: true,
//     },
//   },
// );
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
