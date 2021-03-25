const cheerio = require("cheerio");
const fetch = require("node-fetch");

const Sub = require("./models/Sub");

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
};
