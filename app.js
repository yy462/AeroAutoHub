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
// const openai = require('openai-node')
const axios = require("axios");

const homeStartingContent = "A user-friendly platform for buying and selling pre-owned vehicles, connecting customers with a diverse range of quality second-hand cars from AeroAuto.Join AeroAuto today and let us be your trusted partner in finding the perfect pre-owned vehicle. We lookforward to serving you!";
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const url = "mongodb+srv://" + process.env.USER_NAME + ":" + process.env.USER_PASS + "@cluster0.ruqhhsi.mongodb.net/carDB";
// mongoose.connect("mongodb://127.0.0.1:27017/carDB", {useNewUrlParser: true})//local data connect
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });



const app = express();
console.log(process.env.API_KEY);

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public/static"));

// initialize the session
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// openai.api_key = process.env.OPENAI_KEY;

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
    { type: String }
  ],
  role: String
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
// passport.serializeUser(function(user, done) {
//   process.nextTick(function() {
//     return done(null, {
//       id: user.id,
//       username: user.username,
//       picture: user.picture
//     });
//   });
// });
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// passport.deserializeUser(function(id, done) {
//   process.nextTick(function() {
//     return done(null, id);
//   });
// })
passport.deserializeUser(function (id, done) {
  User.findById(id)
    .then(function (user) {
      done(null, user);
    })
    .catch(function (err) {
      done(err);
    });
});

// identity regist using google
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLINET_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function (accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOne({ 'googleId': profile.id })
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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  } else {
    res.redirect("/login");
  }
}


let cars = [];


app.get("/", function (req, res) {
  Car.find({}).limit(12).then(function (cars) {
    res.render("home", {
      startingContent: homeStartingContent,
      cars: cars
    });
  }).catch(function (err) {
    if (err) {
      console.log(err);
    }
  });
});
// app.get("/", function(req, res){
//   Car.find({}).then(function(cars) {
//     // console.log(cars);
//     res.render("home", {
//       startingContent: homeStartingContent,
//       cars: cars
//     });
//   }).catch(function(err) {
//     if (err) {
//       console.log(err);
//     }
//   });
// });

app.get("/adminDashboard", ensureAdmin, function (req, res) {
  res.render("adminDashboard");
});

app.get("/adminmainpg", ensureAdmin, function (req, res) {
  Car.find({}).limit(12).then(function (cars) {
    res.render("adminmainpg", {
      cars: cars
    });
  }).catch(function (err) {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  User.find({ "secret": { $ne: null } }).then(function (foundUsers) {
    if (foundUsers) {
      res.render("secrets", { usersWithSecrets: foundUsers })
    }
  })
    .catch(function (err) {
      if (err) {
        console.log(err);
      }
    });
});

app.get("/secrets/:postId", ensureAuthenticated, function (req, res) {
  const requestedId = req.params.postId;

  User.findOne({ _id: requestedId })
    .then(function (user) {

      Car.find({}).limit(12).then(function (cars) {
        res.render("secrets", {
          title: user.username,
          startingContent: homeStartingContent,
          cars: cars,
          user: user
        });
      }).catch(function (err) {
        if (err) {
          console.log(err);
        }
      });
    })
    .catch(function (err) {
      if (err) {
        console.log(err);
      }
    })

});

// general user's car viewing page
app.get("/cars/:postId", function (req, res) {
  const requestedId = req.params.postId;

  Car.findOne({ _id: requestedId }).then(function (car) {
    res.render("car", {
      title: (car.brand + " " + car.version + " " + car.year), //
      content: ("price: " + "$" + Math.floor(car.price * 10000 / 6.9).toLocaleString()),
      img: car.imgurl,
      mile: ("Miles: ") + car.mile.toLocaleString() * 10 + "K mi",
      GPS: "GPS: " + (car.GPS ? "Yes" : "no"),
      seats: ("Seats: ") + car.seats//
    });
    // res.redirect("/posts/" + requestedTitle);
  }).catch(function (err) {
    if (err) {
      console.log(err);
    }
  })

});


app.get("/cars/admin/:postId", function (req, res) {
  const requestedId = req.params.postId;

  Car.findOne({ _id: requestedId }).then(function (car) {
    res.render("adminCar", {
      title: (car.brand + " " + car.version + " " + car.year), //
      content: ("price:" + car.price),
      img: car.imgurl
    });
    // res.redirect("/posts/" + requestedTitle);
  }).catch(function (err) {
    if (err) {
      console.log(err);
    }
  })

});

// Specific user's car viewing page
app.get("/cars/:userId/:postId", function (req, res) {
  const requestedCarId = req.params.postId;
  const requestedUserId = req.params.userId;
  User.findOne({ _id: requestedUserId })
    .then(function (user) {
      Car.findOne({ _id: requestedCarId }).then(function (car) {
        res.render("secretCar", {
          email: user.username,
          title: (car.brand + " " + car.version + " " + car.year), //
          content: ("price:" + car.price),
          img: car.imgurl,
          mainpgId: requestedUserId,
          carId: requestedCarId
        });
        // res.redirect("/posts/" + requestedTitle);
      }).catch(function (err) {
        if (err) {
          console.log(err);
        }
      })
    })
    .catch(function (err) {
      if (err) {
        console.log(err);
      }
    })

});




app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("succeed to log out");
    }
  });
  res.redirect("/");
});

app.get("/collections/:postId", function (req, res) {
  const requestedId = req.params.postId;
  User.findOne({ _id: requestedId })
    .then(function (user) {
      if (user) {
        Car.find({ _id: { $in: user.secret } })
          .then(function (cars) {
            res.render("collections", {
              carList: cars,
              title: user.username,
              mainpgId: requestedId,
              user: user
            });
          })
          .catch(function (err) {
            console.log("error finding the cars", err);
            res.status(500).send("Error finding cars");
          });
      } else {
        console.log("User not found");
        res.status(404).send("User not found");
      }
    })
    .catch(function (err) {
      if (err) {
        console.log(err);
        res.status(500).send("Error finding user");
      }
    });
});

app.get('/getMoreCars', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 12;
  const skip = (page - 0) * pageSize;
  console.log("get more cars is running");
  try {
    const cars = await Car.find().skip(skip).limit(pageSize);
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }

});


app.get('/search', async (req, res) => {
  const keyword = req.query.keyword;
  // const requestedId = req.params.postId;
  const cars = await Car.find({ brand: new RegExp(keyword, 'i') });
  res.render('searchRes', {
    cars: cars
  });
  // console.log("found cars are: ", cars);
});

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/login");
      })
    }
  })
});


// app.post("/login", passport.authenticate("local", {
//   failureRedirect: "/login",
//   failureFlash: false
// }), function(req, res) {
//   res.redirect("/secrets/" + req.user._id);
// });

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        if (req.user.role === "admin") {
          res.redirect("/adminmainpg");
        } else {
          res.redirect("/secrets/" + req.user._id);
        }
      });
    }
  })
})


app.post("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});


app.post("/delete", function (req, res) {
  // console.log("try to delete: ", req.body.carId)
  const carToDel = req.body.carId;
  const userId = req.body.userId;
  User.findOne({ _id: userId })
    .then(function (foundUser) {
      if (foundUser) {
        const carIndex = foundUser.secret.indexOf(carToDel);

        if (carIndex != -1) {
          foundUser.secret.splice(carIndex, 1);
          foundUser.save()
            .then(function () {
              console.log("Car removed from the List");
              res.redirect("/collections/" + userId);
            })
            .catch(function (err) {
              console.log("Error saving user after removing car:", err);
              res.status(500).send("Error saving user after removing car");
            });
        } else {
          console.log("submittedCar is not included in the targeted list");
          res.redirect("/collections/" + userId);
        }
      } else {
        console.log("This user is not existed");
        res.redirect("/collections/" + userId);
      }
    })
    .catch(function (err) {
      if (err) {
        console.log(err);
      }
    });
});


app.post("/admindelete", function (req, res) {
  // console.log("try to delete: ", req.body.carId)
  const carToDel = req.body.carId;
  Car.findByIdAndDelete(carToDel)
    .then(function () {
      console.log("Car deleted successfully!");
      res.redirect("/adminmainpg");
    })
    .catch(function (err) {
      if (err) {
        console.log("Error deleting the car", err);
        res.status(500).send("Error deleting the car");
      }
    });
});



app.post("/adminpost", function (req, res) {
  if (req.body.GPS_check === 'true') {
    req.body.GPS = 'true';
  }
  const newcar = new Car({
    brand: req.body.brand,
    year: req.body.year,
    version: req.body.version,
    price: req.body.price,
    mile: req.body.mile,
    GPS: req.body.GPS === 'true',
    seats: req.body.seats,
    imgurl: req.body.imgurl
  });

  newcar.save()
    .then(function () {
      console.log("Car is saved");
      res.redirect("/adminDashboard");
    })
    .catch(function (err) {
      console.log("Error saving user after removing car:", err);
      res.status(500).send("Error adding the new car");
    });
})

app.post("/submit", function (req, res) {
  const submittedCar = req.body.carId;
  const userId = req.body.userId;
  // console.log(submittedCar);
  // console.log(req.body.userId);
  User.findOne({ _id: userId })
    .then(function (founduser) {
      if (founduser) {
        if (!founduser.secret.includes(submittedCar)) {
          founduser.secret.push(submittedCar);
          console.log("push succeed, the secret now is: ", founduser.secret);
          founduser.save().then(function () {
            res.redirect("/cars/" + userId + "/" + submittedCar);
            //if succeed, go back to the specific user's view page
          })
            .catch(function (err) {
              if (err) {
                console.log(err);
              }
            });

        } else {
          console.log("submittedCar already exists in founduser.secret");
          res.redirect("/cars/" + userId + "/" + submittedCar);
        }
      } else {
        console.log("error");
      }
    })
    .catch(function (err) {
      if (err) {
        console.log(err);
      }
    })
});


app.get('/chat', (req, res) => {
  res.render('chat'); // Render the 'client.ejs' view when accessing the root path
});

app.post("/chat", async (req, res) => {
  const input = req.body.messages;
  console.log("input test received: ", req.body)
  const test = [
    {
      role: "user",
      content: input,
    },
  ];
  // const test = [
  //   {
  //     role: "user",
  //     content: "美国的劳动节为什么不是五一",
  //   },  
  // ];
  try {
    const response = await axios.post("http://127.0.0.1:5000/chat", { messages: test });
    res.json({ response: response.data.response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});


//TODO : add the icon to show that the add is successful

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("Server started successfully");
});


