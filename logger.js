const cheerio = require("cheerio");
const fetch = require("node-fetch");
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
    let response = await fetch("https://bincol.ru/freelunch/pin.php/", {
      method: "POST",
    });
    const body = await response.text();
    const htmlRes = cheerio.load(body);
    if (htmlRes(".date_lunch")) {
      let dateTarget = htmlRes(".date_lunch")
        .text()
        .split(String.fromCharCode(160))[1]
        .split(".");
      let time = new Date();
      let formattedTime = `${time.getHours()}:${
        (time.getMinutes() < 10 ? "0" : "") + time.getMinutes()
      }`;
      const newLog = new Log({
        dateTarget: `${dateTarget[0]} ${months[+dateTarget[1] - 1]}`,
        date:
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
