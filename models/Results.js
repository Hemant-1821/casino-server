const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  refNo: String,
  CCON: Object,
  DICOR: Object,
  POLA: Object,
  GRASY: Object,
  totalAmt: String,
});

module.exports = mongoose.model("Results", resultSchema);
