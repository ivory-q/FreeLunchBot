const LocalStrategy = require("passport-local").Strategy;
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const {
  GetNextLunchDate,
  GetUserInformation,
  LunchSignUp,
  LunchCheck,
} = require("../functions");

const User = require("../models/User");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "pin" },
      async (username, pin, done) => {
        let user = await User.findOne({ username: username });
        if (!user) {
          // if (!(await IsFreeLunchWorks())) {
          //   console.log("Passport: FreeLunch is unavailable");
          //   return done(null, false, {
          //     message: "Сервис временно недоступен",
          //   });
          // }
          let studentName = await GetUserInformation(username, pin);

          try {
            if (studentName != "False" && studentName != null) {
              let date = await GetNextLunchDate();
              await LunchSignUp(username, pin, date);

              const newUser = new User({
                name: studentName,
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
