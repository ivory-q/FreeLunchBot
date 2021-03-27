const cheerio = require("cheerio");
const fetch = require("node-fetch");

const Sub = require("./models/Sub");

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
  GetBotState: async (user) => {
    let res = await Sub.findOne({ username: user.username }).catch((err) =>
      console.log(err)
    );
    if (res === null) {
      return true;
    } else {
      return false;
    }
  },
  ChangeBotState: async (user) => {
    let res = await Sub.findOne({ username: user.username }).catch((err) =>
      console.log(err)
    );
    if (res) {
      await Sub.deleteOne({ username: user.username }).catch((err) =>
        console.log(err)
      );
    } else {
      const newSub = new Sub({
        name: user.name,
        username: user.username,
        pin: user.pin,
        date: Date(Date.now()),
      });
      await newSub.save().catch((err) => console.log(err));
    }
  },
  GetNextLunchDate: async () => {
    let response = await fetch("https://bincol.ru/freelunch/pin.php/", {
      method: "POST",
    });
    const body = await response.text();
    const htmlRes = cheerio.load(body);
    if (htmlRes(".date_lunch")) {
      let dateTarget = htmlRes(".date_lunch")
        .text()
        .split(String.fromCharCode(160))[1];
      return dateTarget;
    }
  },
  GetDateVerbal: (date) => {
    let dateTarget = date.split(".");
    dateTarget = `${dateTarget[0]} ${months[+dateTarget[1] - 1]}`;
    return dateTarget;
  },
  GetDateTimeFormatted: (timezoneOffset) => {
    let time = new Date();
    time.setTime(time.getTime() + timezoneOffset * 60 * 60 * 1000);
    let localTime = time.toLocaleString("ru-RU", {
      timezone: "Europe/Moscow",
    });
    let currentDate = localTime.split(",")[0].slice(0, 5);
    let currentTime = localTime.split(",")[1].trimLeft().slice(0, 5);
    return { date: currentDate, time: currentTime };
  },
  IsFreeLunchWorks: async () => {
    let response = await fetch("https://bincol.ru/freelunch/");
    return !response.url.includes("break");
  },
};
