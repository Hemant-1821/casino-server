const mongoose = require("mongoose");

const metalsSchema = new mongoose.Schema({
  gold: String,
  silver: String,
  platinum: String,
});

module.exports = mongoose.model('Metals', metalsSchema);