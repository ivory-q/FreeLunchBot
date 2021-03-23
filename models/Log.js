const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    dateTarget: {
      type: String,
    },
    date: {
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
