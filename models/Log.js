const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date(Date.now()),
    },
    dateTarget: {
      type: String,
    },
    dateFormatted: {
      type: String,
    },
    time: {
      type: String,
    },
    msg: {
      type: String,
      required: true,
    },
  },
  { capped: { size: 2048, max: 10, autoIndexId: true } }
);

const Log = mongoose.model("Log", LogSchema);

module.exports = Log;
