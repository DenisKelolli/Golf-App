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
const Games = require('./models/games');
const finishedGames = require("./models/finishedgames");
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');

const port = "3000";
const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:4173',
  credentials: true
}));

app.use(cookieParser(process.env.SESSION_SECRET));

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
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_CONNECTION_STRING,
    collectionName: 'sessions',  
  }),
  cookie: {
    secure: false,             //set this to false in development
    // sameSite: 'none'        //comment this out in development
  }
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

app.post('/joinGame', async (req, res) => {
  const { playerName, courseName } = req.body;

  try {
    // Check if a game exists for the given course
    const game = await Games.findOne({ courseName });

    // Create a default score array with 18 null scores
    const playerScores = Array(9).fill(0);

    // If game doesn't exist for this course, create one with this player
    if (!game) {
      const newGame = new Games({
        courseName,
        players: [{
          playerName: playerName,
          scores: playerScores
        }]
      });

      // Save the new game
      await newGame.save();
      res.status(200).json(newGame.players);
    } else {
      // If the game exists, check if this player is already in the game
      const existingPlayer = game.players.find(p => p.playerName === playerName);

      if (existingPlayer) {
        // If the player is already in the game, return their scores
        res.status(200).json(existingPlayer);
      } else {
        // If player isn't in the game, add them
        const newPlayer = {
          playerName,
          scores: playerScores
        };
        game.players.push(newPlayer);

        // Save the updated game with the new player/
        await game.save();
        res.status(200).json(game.players);
      }
    }
  } catch (error) {
    console.error('Error while joining game:', error);
    res.status(500).send('Failed to join the game');
  }
});


app.put('/scoreUpdate', async (req, res) => {
  const { courseName, playerName, holeIndex, score } = req.body;

  try {
    let game = await Games.findOne({ courseName });
    if (!game) {
      return res.status(404).send('Game not found for the specified course');
    }

    const playerIndex = game.players.findIndex(p => p.playerName === playerName);

    if (playerIndex !== -1) {
      if (!game.players[playerIndex].scores) {
        game.players[playerIndex].scores = new Array(9).fill(0);
      }
      game.players[playerIndex].scores[holeIndex] = score;
    } else {
      return res.status(404).send('Player not found in the game');
    }

    await game.save();

    // Fetch the updated game to get the latest players
    game = await Games.findOne({ courseName });

    res.status(200).json({ players: game.players });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).send('Failed to update score');
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


app.get('/:courseName/players', ensureAuthenticated, async (req, res) => {
  try {
    const courseName = req.params.courseName;

    // Fetch the game data from the Games collection based on the courseName
    const gameData = await Games.findOne({ courseName });
    if (!gameData) {
      return res.status(404).send(`No active game found for ${courseName}`);
    }
    // Return the players
    res.status(200).json(gameData.players);
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

    // Delete the game from the Games collection
    await Games.findOneAndDelete({ courseName });

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

    mongoose.connection.on('error', err => {
      console.error('Mongoose connection error:', err.message);
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

// module.exports.handler = serverless(app);