const LocalStrategy = require("passport-local").Strategy;
const cheerio = require("cheerio");
const request = require("request-promise");

const User = require("../models/User");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "pin" },
      (username, pin, done) => {
        User.findOne({ username: username }).then((user) => {
          if (!user) {
            request({
              method: "POST",
              url: "https://bincol.ru/freelunch/pin.php",
              resolveWithFullResponse: true,
              formData: {
                student_id: username,
              },
            }).then((res) => {
              cookie = res.headers["set-cookie"][0]
                .split(" ")[0]
                .replace(";", "");
              request({
                method: "POST",
                url: "https://bincol.ru/freelunch/result.php",
                formData: {
                  student_id: username,
                  student_pin: pin,
                },
                headers: {
                  Cookie: cookie,
                },
              })
                .then((res) => {
                  const htmlRes = cheerio(res);
                  try {
                    if (htmlRes.find(".dear_success").text()) {
                      const newUser = new User({
                        name: htmlRes
                          .find(".dear_success")
                          .text()
                          .trim()
                          .replace(",", ""),
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
                        message:
                          "Неправильный номер студенческого или сервис временно недоступен",
                      });
                    }
                  } catch (ex) {
                    console.log("server error");
                    return done(null, false, {
                      message: "Сервис временно недоступен",
                    });
                  }
                })
                .catch((err) => console.log(err));
            });
            // let options = {
            //   method: "POST",
            //   url: "https://bincol.ru/freelunch/result.php",
            //   formData: {
            //     student_id: username,
            //     student_pin: pin,
            //   },
            // };
            // request(options, function (error, response) {
            //   if (error) throw new Error(error);
            //   try {
            //     let htmlRes = cheerio(response.body);
            //     if (htmlRes.find(".dear_success").text()) {
            //       const newUser = new User({
            //         name: htmlRes.find(".dear_success").text().split(",")[0],
            //         username: username,
            //         pin: pin,
            //         date: Date(Date.now()),
            //       });
            //       newUser
            //         .save()
            //         .then((user) => {
            //           return done(null, user);
            //         })
            //         .catch((err) => console.log(err));
            //     } else {
            //       return done(null, false, {
            //         message: "Неправильный номер студенческого или сервис временно недоступен",
            //       });
            //     }
            //   } catch (ex) {
            //     console.log("server error")
            //     return done(null, false, {
            //       message: "Сервис временно недоступен",
            //     });
            //   }
            // });
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
    User.findOne({ username: username }, (err, user) => {
      done(err, user);
    }).catch((err) => console.log(err));
  });
};
