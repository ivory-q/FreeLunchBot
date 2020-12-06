const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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

const User = mongoose.model("User", UserSchema);

module.exports = User;
