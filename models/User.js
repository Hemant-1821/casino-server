const mongoose = require("mongoose");

const record = new mongoose.Schema({
  date: String,
  amt: String,
  order_id: String,
});

const WalletSchema = new mongoose.Schema({
  totalAmt: {
    type: Number,
    default: 0,
  },
  transactions: {
    type: [record],
  },
});

const metalSchema = new mongoose.Schema({
  gold: String,
  silver: String,
  platinum: String,
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      min: 5,
      unique: false,
    },
    phoneNumber: {
      type: Number,
      require: true,
      min: 5,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    wallet: WalletSchema,
    metals: metalSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
