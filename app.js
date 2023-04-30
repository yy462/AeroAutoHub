//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
//for the login and security session
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const homeStartingContent = "A user-friendly platform for buying and selling pre-owned vehicles, connecting customers with a diverse range of quality second-hand cars from AeroAuto.Join AeroAuto today and let us be your trusted partner in finding the perfect pre-owned vehicle. We lookforward to serving you!";
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

// mongoose.connect("mongodb://127.0.0.1:27017/carDB", {useNewUrlParser: true})//local data connect
mongoose.connect("mongodb+srv://1234567890:1234567890@cluster0.ruqhhsi.mongodb.net/carDB", {useNewUrlParser: true, useUnifiedTopology: true});

const app = express();
console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public/static"));

// initialize the session
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// define the data struct
const carSchema = {
  brand: String,
  year: String,
  version: String,
  price: Number,
  mile: Number,
  GPS: Boolean,
  seats: Number,
  imgurl: String
}

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: [
    {type: String}
  ]
});

const Car = mongoose.model(
  "Car",
  carSchema
)

// combine the passport
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

// passport.use(new passportLocalMongoose(User.authenticate()));
passport.use(User.createStrategy());
// passport.use(User.authenticate());
passport.serializeUser(function(user, done) {
  process.nextTick(function() {
    return done(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});


passport.deserializeUser(function(id, done) {
  process.nextTick(function() {
    return done(null, id);
  });
})


// identity regist using google
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLINET_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, done) {
  console.log(profile);
  User.findOne({'googleId': profile.id})
  .then(user => {
      if (!user) {
          user = new User({
              googleId: profile.id
        });
        user.save()
            .then(() => done(null, user))
            .catch(err => done(err));
      } else {
        done(null, user);
      }
  })
  .catch(err => done(err));
}
));

let cars = [];



app.get("/", function(req, res){
  Car.find({}).then(function(cars) {
    res.render("home", {
      startingContent: homeStartingContent,
      cars: cars
    });
  }).catch(function(err) {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/login", function(req, res) {
  res.render("login");
});
app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  User.find({"secret": {$ne: null}}).then(function(foundUsers) {
    if (foundUsers) {
      res.render("secrets", {usersWithSecrets: foundUsers})
    }
  })
  .catch(function(err) {
    if (err) {
      console.log(err);
    }
  });
});


app.get("/cars/:postId", function(req, res){
  const requestedId = req.params.postId;

  Car.findOne({_id: requestedId}).then(function(car) {
      res.render("car", {
        title: (car.brand + " " + car.version + " " + car.year), //
        content: ("price:" + car.price),
        img: car.imgurl //
      });
      // res.redirect("/posts/" + requestedTitle);
  }).catch(function(err) {
    if (err) {
      console.log(err);
    }
  })

});


app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/login");
      })
    }
  })
});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    passpword: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res,function() {
        res.redirect("/secrets");
      });
    }
  });
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("Server started successfully");
}); 


