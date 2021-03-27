const LocalStrategy = require("passport-local").Strategy;
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const { GetNextLunchDate, IsFreeLunchWorks } = require("../functions");

const User = require("../models/User");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "pin" },
      async (username, pin, done) => {
        let user = await User.findOne({ username: username });
        if (!user) {
          if (!(await IsFreeLunchWorks())) {
            console.log("Passport: FreeLunch is unavailable");
            return done(null, false, {
              message: "Сервис временно недоступен",
            });
          }
          let secret = "7e9c2eb131947c62ba1e51e4e265aa01";
          let date = await GetNextLunchDate();
          let params = new URLSearchParams();
          params.append("secret", secret);
          params.append("studentID", username);
          params.append("date", date);

          let response = await fetch(
            "https://bincol.ru/freelunch/api/register/",
            {
              method: "POST",
              body: params,
            }
          );

          response = await fetch(
            "https://bincol.ru/freelunch/api/checkLunch/",
            {
              method: "POST",
              body: params,
            }
          );
          let status = await response.json();
          params = new URLSearchParams();
          params.append("student_id", username);
          response = await fetch("https://bincol.ru/freelunch/pin.php/", {
            method: "POST",
            body: params,
          });

          let cookie = response.headers.raw()["set-cookie"][0].split(";")[0];

          params.append("student_pin", pin);
          response = await fetch("https://bincol.ru/freelunch/result.php/", {
            method: "POST",
            body: params,
            headers: { Cookie: cookie },
          });

          const body = await response.text();
          const htmlRes = cheerio.load(body);

          try {
            if (status.status && htmlRes(".dear_success").text()) {
              const newUser = new User({
                name: htmlRes(".dear_success").text().trim().replace(",", ""),
                username: username,
                pin: pin,
                date: Date(Date.now()),
              });
              newUser
                .save()
                .then((user) => {
                  return done(null, user);
                })
                .catch((err) => console.log("Add New User error", err));
            } else {
              return done(null, false, {
                message:
                  "Неправильный номер студенческого или сервис временно недоступен",
              });
            }
          } catch (ex) {
            console.log("server error", ex);
            return done(null, false, {
              message: "Сервис временно недоступен",
            });
          }
        } else {
          if (user.pin === pin) {
            return done(null, user);
          } else {
            return done(null, false, {
              message: "Неправильный PIN",
            });
          }
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.username);
  });

  passport.deserializeUser(async (username, done) => {
    try {
      let user = await User.findOne({ username: username });
      done(null, user);
    } catch (err) {
      console.log("deserializeUser error", err);
      done(err, false);
    }
  });
};
