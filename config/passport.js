const LocalStrategy = require("passport-local").Strategy;
const cheerio = require("cheerio");
const request = require("request");

const User = require("../models/User");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "pin" },
      (username, pin, done) => {
        User.findOne({ username: username }).then((user) => {
          if (!user) {
            let options = {
              method: "POST",
              url: "https://bincol.ru/freelunch/index.php",
              formData: {
                login: username,
                pin: pin,
              },
            };
            request(options, function (error, response) {
              if (error) throw new Error(error);
              try {
                let htmlRes = cheerio(response.body);
                if (htmlRes.find(".message_ok").text()) {
                  const newUser = new User({
                    name: htmlRes.find(".message_ok").text().split(",")[0],
                    username: username,
                    pin: pin,
                    date: Date(Date.now()),
                  });
                  newUser
                    .save()
                    .then((user) => {
                      return done(null, user);
                    })
                    .catch((err) => console.log(err));
                } else {
                  return done(null, false, {
                    message: "Неправильный номер студенческого или сервис временно недоступен",
                  });
                }
              } catch (ex) {
                console.log("server error")
                return done(null, false, {
                  message: "Сервис временно недоступен",
                });
              }
            });
          } else {
            if (user.pin === pin) {
              return done(null, user);
            } else {
              return done(null, false, {
                message: "Неправильный PIN",
              });
            }
          }
        });
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.username);
  });

  passport.deserializeUser((username, done) => {
    User.findOne({username: username}, (err, user) => {
      done(err, user);
    }).catch((err) => console.log(err));
  });
};
