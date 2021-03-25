const path = require("path");
const flash = require("connect-flash");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const passport = require("passport");
const fetch = require("node-fetch");
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const compression = require("compression");
const { asyncQueue } = require("./taskQueue");
const { logger } = require("./logger");
const { GetNextLunchDate } = require("./functions");
//Routes
const index = require("./routes/index");
const offline = require("./routes/offline");
const login = require("./routes/login");
const logout = require("./routes/logout");
const deleteUsr = require("./routes/delete");
const dashboard = require("./routes/dashboard");
const bot = require("./routes/bot");
//Models
const Sub = require("./models/Sub");
const Log = require("./models/Log");

const app = express();
app.use(compression());

require("./config/passport")(passport);
const db = require("./config/mongo").MongoURI;

process.addListener("unhandledRejection", (e) => {
  console.log("UNHANDLED REJECTION");
  console.log(e);
});

const queue = asyncQueue((concurrency = 20));

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected..."))
  .then(MainBot("Immediate"))
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

//Routes
app.use("/", index);
app.use("/offline", offline);
app.use("/dashboard", dashboard);
app.use("/login", login);
app.use("/logout", logout);
app.use("/delete", deleteUsr);
app.use("/bot", bot);
app.use(function (req, res, next) {
  res.status(404).render("404");
});

async function MainBot(typestr) {
  let lastSubscription = await Log.find({}).sort({ date: -1 }).limit(1);
  let timeDiff = (Date.now() - lastSubscription[0].date) / 3600000;

  console.log(`\x1b[33m Last Subscription ${timeDiff.toFixed(2)}h ago\x1b[0m`);
  if (timeDiff < 2.5) {
    return;
  }

  let subs = await Sub.find({});
  if (!subs) return;
  let secret = "7e9c2eb131947c62ba1e51e4e265aa01";
  let date = await GetNextLunchDate();
  let count = 1;
  let success = 0;
  console.log(`\x1b[33m====>> ${typestr} Subscription: ${subs.length}\x1b[0m`);

  subs.forEach((user) => {
    queue.push(async (done) => {
      let params = new URLSearchParams();
      params.append("secret", secret);
      params.append("studentID", user.username);
      params.append("date", date);

      let response = await fetch("https://bincol.ru/freelunch/api/register/", {
        method: "POST",
        body: params,
      });

      response = await fetch("https://bincol.ru/freelunch/api/checkLunch/", {
        method: "POST",
        body: params,
      });
      let res = await response.json();

      try {
        if (res.status) {
          console.log(`${count} \x1b[32mSuccess\x1b[0m:`, user.name);
          success++;
        } else {
          console.log(`${count} \x1b[31mError\x1b[0m:`, user.name);
        }
        count += 1;
      } catch (ex) {
        console.log("server error");
      }
      done();
    });
  });
  queue.pushAfter((done) => {
    logger(success);
    done();
  });
}

setInterval(() => {
  MainBot("Timed");
}, 1000 * 60 * 60 * 3);
// Default time
// 1000 * 60 * 60 * 2

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
