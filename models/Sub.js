const mongoose = require("mongoose");

const SubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  pin: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date(Date.now()),
  },
});

const Sub = mongoose.model("Sub", SubSchema);

module.exports = Sub;
