const { GetNextLunchDate } = require("./functions");

const Log = require("./models/Log");

let months = [
  "Января",
  "Февраля",
  "Марта",
  "Апреля",
  "Мая",
  "Июня",
  "Июля",
  "Августа",
  "Сентября",
  "Октября",
  "Ноября",
  "Декабря",
];

module.exports = {
  logger: async (msg) => {
    let nexLunchDate = await GetNextLunchDate();
    if (nexLunchDate) {
      let dateTarget = nexLunchDate.split(".");
      let time = new Date();
      time.setTime(time.getTime() + 3 * 60 * 60 * 1000);
      let localTime = time.toLocaleString("ru-RU", {
        timezone: "Europe/Moscow",
      });
      let currentDate = localTime.split(",")[0].slice(0, 5);
      let currentTime = localTime.split(",")[1].trimLeft().slice(0, 5);

      const newLog = new Log({
        dateTarget: `${dateTarget[0]} ${months[+dateTarget[1] - 1]}`,
        dateFormatted: currentDate,
        time: currentTime,
        msg: msg,
      });
      console.log(newLog.dateTarget);
      console.log(newLog.dateFormatted);
      console.log(newLog.time);
      console.log(newLog.msg);

      // await newLog.save().catch((err) => console.log(err));
    } else {
      console.log(`\x1b[31mLogging Error\x1b[0m:`);
    }
  },
};
