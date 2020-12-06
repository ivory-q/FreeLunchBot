const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const cheerio = require("cheerio");
const request = require("request");
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const { ensureAuthenticated } = require("./config/auth");

const User = require("./models/User");
const Sub = require("./models/Sub");

const app = express();

require("./config/passport")(passport);
const db = require("./config/mongo").MongoURI;

process.addListener('unhandledRejection', (e)=> {
  console.log("UNHANDLED REJECTION")
  console.log(e)
})

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

app.use(favicon(path.join(__dirname, "favicon.ico")));
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

app.get("/delete", (req, res) => {
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

app.get("/list", (req, res) => {
  Sub.find({}).then((collection) => {
    res.render("list", {
      list: collection,
    });
  });
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
  subs.forEach((user) => {
    let options = {
      method: "POST",
      url: "https://bincol.ru/freelunch/index.php",
      formData: {
        login: user.username,
        pin: user.pin,
      },
    };
    request(options, function (error, response) {
      if (error) console.log(new Error(error));
      const htmlRes = cheerio(response.body);
      if (htmlRes.find(".message_ok").text()) {
        console.log(user.name, "successfully signed on");
      }
    });
  });
  console.log("====>> Immediate");
}

function MainBot() {
  setTimeout(async () => {
    let subs = await Sub.find({}).catch((err) => console.log(err));
    if (!subs) return;
    subs.forEach((user) => {
      let options = {
        method: "POST",
        url: "https://bincol.ru/freelunch/index.php",
        formData: {
          login: user.username,
          pin: user.pin,
        },
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        const htmlRes = cheerio(response.body);
        if (htmlRes.find(".message_ok").text()) {
          console.log(user.name, "successfully signed on");
        }
      });
    });
    MainBot();
  }, 1000 * 60 * 60 * 2);
}

Immediate();
MainBot();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
