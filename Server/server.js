const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const expressSession = require('express-session');
const cors = require("cors");
const Courses = require("./models/courses");
const Users = require("./models/users");
require("dotenv").config();
const Games = require('./models/games')

const port = "3000";
const app = express();

app.use(express.json());
app.use(cors(
  {
    origin: 'http://localhost:5173',
    credentials: true
  }
));

// Session handling
app.use(expressSession({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await Users.findOne({ username });
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) return done(null, user);
    else return done(null, false, { message: 'Incorrect password.' });
  } catch (err) {
    return done(err);
  }
}));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Users.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

// Login route
app.post('/signin', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).send('Authentication failed.');
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.userId = user._id; // Store user's ID in session
      return res.status(200).send('Authenticated');
    });
  })(req, res, next);
});

app.get('/getusersname', async (req, res) => {
  try {
    // Retrieve the user's ID from the session
    const userId = req.session.userId;

    // Find the user in the Users collection by their ID
    const user = await Users.findById(userId);

    // Respond with the user's name
    res.json({ name: user.name });
  } catch (error) {
    console.error('Error retrieving user name:', error);
    res.status(500).send('Error retrieving user name');
  }
});

// Middleware to ensure authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    console.log("User is not Logged in and can't access this page");
    return res.status(403).send("User is not Logged in and can't access this page");
  }
}

app.get('/courseselection',ensureAuthenticated,  (req, res) => {
  Courses.find()
    .then(courses => {
      console.log('Courses retrieved:', courses);
      // Extract only the course names and send them
      const courseNames = courses.map(course => course.courseName);
      res.send(courseNames); //Send back an array of courseNames
    })
    .catch(err => {
      console.error('Error retrieving courses:', err); 
      res.status(500).send('Error retrieving courses');
    });
});


app.get('/highlandgreens',ensureAuthenticated,  (req, res) => {
  // Find the course by name "HighLand Greens" in the Courses collection
  Courses.findOne({ courseName: "HighLand Greens" })
    .then(course => {
      if (!course) {
        return res.status(404).send('Course not found');
      }

      // Extract holeNumber and parNumber values from each hole
      const holesData = course.holes.map(hole => ({
        holeNumber: hole.holeNumber,
        parNumber: hole.parNumber
      }));

      console.log('Holes data retrieved:', holesData); 
      res.send(holesData);
    })
    .catch(err => {
      console.error('Error retrieving holes data:', err); 
      res.status(500).send('Error retrieving holes data');
    });
});


app.post('/highlandgreens', async (req, res) => {
  try {
    const players = req.body.players;
    const courseName = req.body.courseName;
    
    // Create a new game with the provided players' data and course name
    const game = new Games({
      courseName, 
      players: players.map(player => ({
        playerName: player.playerName, 
        scores: player.scores,
      })),
    });

    await game.save(); // Save the game to the database

    res.status(201).json({ message: 'Game saved successfully!' });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ message: 'Failed to save game. Please try again.' });
  }
});

app.post('/register',  async (req, res) => {
  const { name, username, password } = req.body;

  // Check if the username already exists
  const existingUser = await Users.findOne({ username });
  if (existingUser) {
    return res.json({ usernameExists: true });
  }

  // Encrypt the password
  const salt = await bcrypt.genSalt(10);
  const encryptedPassword = await bcrypt.hash(password, salt);

  // Save to the Users collection in MongoDB
  const newUser = new Users({
    name,
    username,
    password: encryptedPassword,
  });

  try {
    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).send('Error registering user');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Failed to destroy session:', err);
      res.status(500).send('Failed to logout');
    } else {
      res.status(200).send('Logged out successfully');
    }
  });
});



const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB'); 
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (e) {
    console.log('Could not connect to MongoDB...', e.message); 
  }
};

start();
