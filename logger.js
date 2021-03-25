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
      let formattedTime = `${time.getHours() + 3}:${
        (time.getMinutes() < 10 ? "0" : "") + time.getMinutes()
      }`;
      const newLog = new Log({
        dateTarget: `${dateTarget[0]} ${months[+dateTarget[1] - 1]}`,
        dateFormatted:
          (time.getDate() < 10 ? "0" : "") +
          time.getDate() +
          "." +
          (time.getMonth() < 10 ? "0" : "") +
          (time.getMonth() + 1),
        time: formattedTime,
        msg: msg,
      });

      await newLog.save().catch((err) => console.log(err));
    } else {
      console.log(`\x1b[31mLogging Error\x1b[0m:`);
    }
  },
};
