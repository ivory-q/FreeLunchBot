const {
  GetNextLunchDate,
  GetDateVerbal,
  GetDateTimeFormatted,
  IsFreeLunchWorks,
} = require("./functions");

const Log = require("./models/Log");

module.exports = {
  logger: async (msg) => {
    if (!(await IsFreeLunchWorks())) {
      console.log("Logger: FreeLunch is unavailable");
      return;
    }
    let nextLunchDate = await GetNextLunchDate();
    if (nextLunchDate) {
      let dateTarget = GetDateVerbal(nextLunchDate);
      let dateTime = GetDateTimeFormatted(3);

      const newLog = new Log({
        dateTarget: dateTarget,
        dateFormatted: dateTime.date,
        time: dateTime.time,
        msg: msg,
      });

      await newLog.save().catch((err) => console.log(err));
    } else {
      console.log(`\x1b[31mLogging Error\x1b[0m:`);
    }
  },
};
