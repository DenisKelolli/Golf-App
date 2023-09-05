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
const finishedGames = require("./models/finishedgames");
// const serverless = require("serverless-http");

const port = "3000";
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:4173',
    methods: ['GET', 'POST'],
    credentials:true
  },
});


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:4173',
  credentials: true
}));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(403).send("User is not Logged in and can't access this page");
  }
}
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


const playersByCourse = {}; // Store the players for each course
const playersBySocketId = {}; // Maintain a mapping of socket IDs to players

io.on('connection', (socket) => {
  console.log('User connected');

  // Send the latest state of all players to the newly connected client
  const allPlayers = Object.values(playersByCourse).flat(); // Gather all players from all courses (if you have multiple courses in the future)
  socket.emit('initialPlayersState', allPlayers); // Send to the client that just connected

  socket.on('joinCourse', async (player) => {
    const courseName = player.courseName;

    // Ensure there's an array for this course in the in-memory storage
    if (!playersByCourse[courseName]) {
        playersByCourse[courseName] = [];
    }

    // Check if this player is already connected in memory
    const existingPlayerInMemory = playersByCourse[courseName].find(p => p.name === player.name);
    if (existingPlayerInMemory) {
        console.log(`Player with name ${player.name} reconnected to ${courseName}`);
        Object.assign(existingPlayerInMemory, player); // Update the player's details in memory
        return;
    }

    // Fetch the existing game for this course from the database
    let game = await Games.findOne({ courseName });

    // Initialize player scores with default values
    let playerScores = new Array(9).fill(0);

    // If the game exists, check if this player is part of it and update their scores
    if (game) {
        const playerInDb = game.players.find(p => p.playerName === player.name);
        if (playerInDb) {
            playerScores = playerInDb.scores;
        } else {
            // If player isn't in the database for this game, add them with default scores
            game.players.push({
                playerName: player.name,
                scores: playerScores
            });
            await game.save(); // Persist the updated game to the database
        }
    } else {
        // If game doesn't exist for this course, create one with this player
        game = new Games({
            courseName,
            players: [{
                playerName: player.name,
                scores: playerScores
            }]
        });
        await game.save();
    }

    // Prepare the player object with data from database or defaults and add to in-memory storage
    const newPlayer = {
        ...player,
        courseName,
        socketId: socket.id,
        scores: playerScores,
        joinedAt: Date.now()
    };
    playersByCourse[courseName].push(newPlayer);
    playersBySocketId[socket.id] = newPlayer;

    // Sort the players by name
    playersByCourse[courseName].sort((a, b) => a.name.localeCompare(b.name));

    // Emit an event notifying everyone that a new player has joined
    io.emit('newPlayerJoined', playersByCourse[courseName]);
    console.log(`New player ${player.name} has joined ${courseName}`);

    // Send the player data (including scores) to the client that just connected
    socket.emit('playerData', newPlayer);
});



  socket.on('scoreUpdate', async (data) => {
    const { courseName, playerName, holeIndex, score } = data;
  
    try {
      // Find an existing game for the course
      let game = await Games.findOne({ courseName });
      if (!game) {
        // If no game is found for the course, create a new one
        game = new Games({
          courseName,
          players: [] // Initialize with an empty players array
        });
        console.log(`Created a new game for course ${courseName}`);
      }
  
      // Check if the player already exists in the game
      const existingPlayerIndex = game.players.findIndex(player => player.playerName === playerName);
  
      if (existingPlayerIndex !== -1) {
        // Update the player's score for the specific hole if found
        if (!game.players[existingPlayerIndex].scores) {
          game.players[existingPlayerIndex].scores = new Array(9).fill(0); // Assuming there are 9 holes; adjust accordingly
        }
        game.players[existingPlayerIndex].scores[holeIndex] = score;
      } else {
        // Add the player if not found
        game.players.push({
          playerName,
          scores: new Array(9).fill(0).map((v, i) => i === holeIndex ? score : v) // Insert the score at the specific hole index
        });
      }
  
      // Save the updated or new game document
      await game.save();
  
      // Fetch the updated game to get the latest players (Added this line)
      game = await Games.findOne({ courseName });
  
      // Notify all connected clients of the score update with the players array (Modified this line)
      io.sockets.emit('scoreUpdate', { players: game.players }); // Send to all connected clients
    } catch (error) {
      console.error(`Failed to update or create game in database for course ${courseName}`, error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
    const player = playersBySocketId[socket.id];
    if (player && player.courseName) {
        const courseName = player.courseName;

        if (playersByCourse[courseName]) {
            playersByCourse[courseName] = playersByCourse[courseName].filter(p => p.socketId !== socket.id);
        }

        delete playersBySocketId[socket.id];

        // Emit an updatedPlayersList event with the full list
        socket.broadcast.emit('updatedPlayersList', playersByCourse[courseName]);
    }
});

});


app.get('/isAuthenticated', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
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

app.get('/getusersname',ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await Users.findById(userId);
    res.json({ name: user.name });
  } catch (error) {
    console.error('Error retrieving user name:', error);
    res.status(500).send('Error retrieving user name');
  }
});


app.get('/courseselection',ensureAuthenticated,  (req, res) => {
  Courses.find()
    .then(courses => {
      const courseNames = courses.map(course => course.courseName);
      res.send(courseNames);
    })
    .catch(err => {
      res.status(500).send({error: 'Error retrieving courses', data: []});
    });
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

app.get("/history", async (req,res) => {
  try{
    const games = await finishedGames.find();
    res.json(games);
  } catch(err){
    res.status(500).json({message:"Internal service error"})
  };
});


app.get('/:courseName', ensureAuthenticated, async (req, res) => {
  const courseName = req.params.courseName; // Dynamic course name from the URL
  
  try {
    // Fetch the course data from the Courses collection
    const courseData = await Courses.findOne({courseName});
    // Fetch the game data from the Games collection
    const gameData = await Games.findOne({ courseName });

    // Prepare the response, including both hole information and scores
    const response = {
      holes: courseData.holes,
      scores: gameData ? gameData.players.map(player => ({ playerName: player.playerName, scores: player.scores })) : []
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching course data:', error);
    res.status(500).send('Error fetching course data');
  }
});


app.get('/:courseName/players', ensureAuthenticated, (req, res) => {
  try {
    const courseName = req.params.courseName;
    const players = (playersByCourse[courseName] || []).sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).json(players);
  } catch (err) {
    console.error('Error retrieving players:', err);
    return res.status(500).send('Error retrieving players');
  }
});



app.post('/:courseName', ensureAuthenticated, async (req, res) => {
  try {
    const players = req.body.players;
    const courseName = req.params.courseName;

    // Save the finished game to the finishedGames collection
    const finishedGame = new finishedGames({
      courseName, 
      players: players.map(player => ({
        playerName: player.playerName, 
        scores: player.scores,
      })),
    });
    await finishedGame.save();

    // Optionally: Delete the game from the Games collection
    await Games.findOneAndDelete({ courseName });

    io.emit('newPlayerJoined'); // Notify all clients about the new player
    res.status(201).json({ message: 'Finished game saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save finished game. Please try again.' });
  }
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

// module.exports.handler = serverless(app);