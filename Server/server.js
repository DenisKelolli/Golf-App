const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const expressSession = require('express-session');
const cors = require("cors");
const Courses = require("./models/courses");
const Users = require("./models/users");
require("dotenv").config();
const Games = require('./models/games');

const port = "3000";
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(expressSession({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

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

const playersByCourse = {};

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('joinCourse', (player) => {
    const courseName = "HighLand Greens";

    if (!playersByCourse[courseName]) {
      playersByCourse[courseName] = [];
    }

    const existingPlayer = playersByCourse[courseName].find(p => p.name === player.name);

    if (!existingPlayer) {
      playersByCourse[courseName].push({ ...player, socketId: socket.id });
    }

    io.emit('newPlayerJoined', playersByCourse[courseName]);
    console.log(`New player ${player.name} has joined ${courseName}`);
    console.log('Current players:', playersByCourse[courseName]); // Display current players
  });
  
  socket.on('scoreUpdate', (data) => {
    const { courseName, playerIndex, holeIndex, score } = data;
  
    // Update the corresponding player's score
    playersByCourse[courseName][playerIndex].scores[holeIndex] = score;
  
    // Notify all clients about the score update
    io.emit('scoreUpdate', playersByCourse[courseName]);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');

    for (const course in playersByCourse) {
      playersByCourse[course] = playersByCourse[course].filter(player => player.socketId !== socket.id);
      io.emit('newPlayerJoined', playersByCourse[course]);
    }
  });
});

app.post('/signin', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).send('Authentication failed.');
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.userId = user._id;
      return res.status(200).send('Authenticated');
    });
  })(req, res, next);
});

app.get('/getusersname', async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await Users.findById(userId);
    res.json({ name: user.name });
  } catch (error) {
    console.error('Error retrieving user name:', error);
    res.status(500).send('Error retrieving user name');
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(403).send("User is not Logged in and can't access this page");
  }
}

app.get('/courseselection',ensureAuthenticated,  (req, res) => {
  Courses.find()
    .then(courses => {
      const courseNames = courses.map(course => course.courseName);
      res.send(courseNames);
    })
    .catch(err => {
      res.status(500).send('Error retrieving courses');
    });
});

app.get('/highlandgreens', ensureAuthenticated, async (req, res) => {
  try {
    const courseData = await Courses.findOne({ courseName: "HighLand Greens" });
    res.json(courseData.holes);
  } catch (error) {
    console.error('Error fetching course data:', error);
    res.status(500).send('Error fetching course data');
  }
});

app.get('/highlandgreens/players', ensureAuthenticated, async (req, res) => {
  try {
    const games = await Games.findOne({ courseName: "HighLand Greens" });
    if (games && games.players) {
      return res.status(200).json(games.players);
    }
    return res.status(200).json([]);
  } catch (err) {
    console.error('Error retrieving players:', err);
    return res.status(500).send('Error retrieving players');
  }
});

app.post('/highlandgreens', ensureAuthenticated, async (req, res) => {
  try {
    const players = req.body.players;
    const courseName = req.body.courseName;
    
    const existingGame = await Games.findOne({ courseName });
    if (existingGame) {
      existingGame.players.push(...players);
      await existingGame.save();
      io.emit('newPlayerJoined'); // Notify all clients about the new player
      return res.status(201).json({ message: 'Game updated successfully!' });
    }

    const gameInDb = new Games({
      courseName, 
      players: players.map(player => ({
        playerName: player.playerName, 
        scores: player.scores,
      })),
    });
    await gameInDb.save();
    res.status(201).json({ message: 'Game saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save game. Please try again.' });
  }
});

app.post('/register',  async (req, res) => {
  const { name, username, password } = req.body;
  const existingUser = await Users.findOne({ username });
  if (existingUser) {
    return res.json({ usernameExists: true });
  }
  const salt = await bcrypt.genSalt(10);
  const encryptedPassword = await bcrypt.hash(password, salt);
  const newUser = new Users({
    name,
    username,
    password: encryptedPassword,
  });
  try {
    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
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
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (e) {
    console.log('Could not connect to MongoDB...', e.message);
  }
};

start();
