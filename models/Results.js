const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  refNo: String,
  CCON: Array,
  DICOR: Array,
  POLA: Array,
  GRASY: Array,
  totalAmt: String,
});

module.exports = mongoose.model("Results", resultSchema);
