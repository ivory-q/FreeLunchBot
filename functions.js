const fetch = require("node-fetch");
const md5 = require("md5");

const Sub = require("./models/Sub");

let secret = "7e9c2eb131947c62ba1e51e4e265aa01";
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
    let params = new URLSearchParams();
    params.append("secret", secret);

    let response = await fetch("https://bincol.ru/freelunch/api/nextDate/", {
      method: "POST",
      body: params,
    });
    const body = await response.json();
    if (body?.date != null) {
      return body.date;
    }
    console.log("Api Next Lunch Error");
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
  GetUserInformation: async (studentID, studentPIN) => {
    let params = new URLSearchParams();
    params.append("secret", secret);
    params.append("studentID", studentID);
    params.append("studentPIN", md5(studentPIN));

    let response = await fetch("https://bincol.ru/freelunch/api/studentInfo/", {
      method: "POST",
      body: params,
    });
    let res = await response.json();
    return res.name;
  },
  // IsFreeLunchWorks: async () => {
  //   let response = await fetch("https://bincol.ru/freelunch/");
  //   return !response.url.includes("break");
  // },
  LunchSignUp: async (studentID, date) => {
    let params = new URLSearchParams();
    params.append("secret", secret);
    params.append("studentID", studentID);
    params.append("date", date);

    await fetch("https://bincol.ru/freelunch/api/register/", {
      method: "POST",
      body: params,
    });
  },
  LunchCheck: async (studentID, date) => {
    let params = new URLSearchParams();
    params.append("secret", secret);
    params.append("studentID", studentID);
    params.append("date", date);

    let response = await fetch("https://bincol.ru/freelunch/api/checkLunch/", {
      method: "POST",
      body: params,
    });
    let res = await response.json();
    return res.status;
  },
};
