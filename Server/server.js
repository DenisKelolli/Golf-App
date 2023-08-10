const express = require('express');
const mongoose = require('mongoose');
const port = "3000";
const app = express();
require("dotenv").config();
const cors = require("cors");
const Courses = require("./models/courses");
const Games = require("./models/games")

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  Courses.find()
    .then(courses => {
      console.log('Courses retrieved:', courses); // Log the courses
      res.send(courses);
    })
    .catch(err => {
      console.error('Error retrieving courses:', err); // Log the error
      res.status(500).send('Error retrieving courses');
    });
});

app.get('/getGame', (req, res) => {
  Games.find()
    .populate('courseName') // Populate the course information
    .then(games => {
      console.log('Games retrieved:', games); // Log the games with the course details
      res.send(games);
    })
    .catch(err => {
      console.error('Error retrieving games:', err); // Log the error
      res.status(500).send('Error retrieving games');
    });
});



const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB'); // This line logs the success message
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (e) {
    console.log('Could not connect to MongoDB...', e.message); // This line logs the error message
  }
};

start();
