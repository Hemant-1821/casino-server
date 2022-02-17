const mongoose = require("mongoose");

const withDrawSchema = new mongoose.Schema({
  amt: String,
  userId: String,
  accountNo: String,
  ifsc: String,
  transactionId: String,
  amtTrans: String,
});

module.exports = mongoose.model("Withdraw", withDrawSchema);
