const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const cheerio = require("cheerio");
const request = require("request-promise");
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const compression = require("compression");
const { ensureAuthenticated } = require("./config/auth");

const User = require("./models/User");
const Sub = require("./models/Sub");

const app = express();
app.use(compression());

require("./config/passport")(passport);
const db = require("./config/mongo").MongoURI;
const { Console } = require("console");

process.addListener("unhandledRejection", (e) => {
  console.log("UNHANDLED REJECTION");
  console.log(e);
});

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

app.use(favicon(path.join(__dirname, "views", "icons", "favicon.ico")));
app.use(express.static(path.join(__dirname, "views")));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "cacatoo fish",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 360,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//routes
app.get(
  "/",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      res.redirect("/dashboard");
    } else {
      next();
    }
  },
  (req, res) => {
    res.redirect("/login");
  }
);

app.get("/offline", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "offline.html"));
});

app.get("/dashboard", ensureAuthenticated, async (req, res) => {
  let state = await GetBotState(req.user);
  res.render("dashboard", {
    name: req.user.name,
    btn_start: state,
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});

app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "Вы вышли");
  res.redirect("/login");
});

app.get("/delete", async (req, res) => {
  if (!(await GetBotState(req.user))) {
    Sub.deleteOne({ username: req.user.username }).catch((err) => {
      console.log(err);
    });
  }
  User.deleteOne({ username: req.user.username }).catch((err) =>
    console.log(err)
  );
  req.logout();
  req.flash("success_msg", "Аккаунт успешно удален");
  res.redirect("/login");
});

app.post("/bot", async (req, res) => {
  await ChangeBotState(req.user);
  res.redirect("/dashboard");
});

async function GetBotState(user) {
  let res = await Sub.findOne({ username: user.username }).catch((err) =>
    console.log(err)
  );
  if (res === null) {
    return true;
  } else {
    return false;
  }
}

async function ChangeBotState(user) {
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
}

async function Immediate() {
  let subs = await Sub.find({}).catch((err) => console.log(err));
  if (!subs) return;
  console.log(`====>> Immediate Subscription: ${subs.length}`);
  let count = 0;
  let cookie;
  subs.forEach((user) => {
    request({
      method: "POST",
      url: "https://bincol.ru/freelunch/pin.php",
      resolveWithFullResponse: true,
      formData: {
        student_id: user.username,
      },
    }).then((res) => {
      cookie = res.headers["set-cookie"][0].split(" ")[0].replace(";", "");
      request({
        method: "POST",
        url: "https://bincol.ru/freelunch/result.php",
        formData: {
          student_id: user.username,
          student_pin: user.pin,
        },
        headers: {
          Cookie: cookie,
        },
      })
        .then((res) => {
          const htmlRes = cheerio(res);
          count += 1;
          try {
            if (htmlRes.find(".dear_success").text()) {
              console.log(`${count}:`, user.name, "successfully signed on");
            } else {
              console.log(`${count}:`, user.name, "error");
            }
          } catch (ex) {
            console.log("server error");
          }
        })
        .catch((err) => console.log(err));
    });
  });
}

function MainBot() {
  setTimeout(async () => {
    let subs = await Sub.find({}).catch((err) => console.log(err));
    if (!subs) return;
    console.log(`====>> Timed Subscription: ${subs.length}`);
    let count = 0;
    let cookie;
    subs.forEach((user) => {
      request({
        method: "POST",
        url: "https://bincol.ru/freelunch/pin.php",
        resolveWithFullResponse: true,
        formData: {
          student_id: user.username,
        },
      }).then((res) => {
        cookie = res.headers["set-cookie"][0].split(" ")[0].replace(";", "");
        request({
          method: "POST",
          url: "https://bincol.ru/freelunch/result.php",
          formData: {
            student_id: user.username,
            student_pin: user.pin,
          },
          headers: {
            Cookie: cookie,
          },
        })
          .then((res) => {
            const htmlRes = cheerio(res);
            count += 1;
            try {
              if (htmlRes.find(".dear_success").text()) {
                console.log(`${count}:`, user.name, "successfully signed on");
              } else {
                console.log(`${count}:`, user.name, "error");
              }
            } catch (ex) {
              console.log("server error");
            }
          })
          .catch((err) => console.log(err));
      });
    });
    MainBot();
  }, 1000 * 60 * 60 * 2);
}
// Default time
// 1000 * 60 * 60 * 2

app.use(function (req, res, next) {
  res.status(404).render("404");
});

Immediate();
MainBot();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
