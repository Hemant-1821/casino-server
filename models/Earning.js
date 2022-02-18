const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema(
  {
    amt: String,
    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Earnings", earningSchema);
