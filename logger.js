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
      let time = new Date().toLocaleString("ru-RU", {
        timezone: "Europe/Moscow",
      });
      let currentDate = time.split(",")[0].slice(0, 5);
      let currentTime = time.split(",")[1].trimLeft().slice(0, 5);

      const newLog = new Log({
        dateTarget: `${dateTarget[0]} ${months[+dateTarget[1] - 1]}`,
        dateFormatted: currentDate,
        time: currentTime,
        msg: msg,
      });

      await newLog.save().catch((err) => console.log(err));
    } else {
      console.log(`\x1b[31mLogging Error\x1b[0m:`);
    }
  },
};
