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

app.get('/courseselection', (req, res) => {
  Courses.find()
    .then(courses => {
      console.log('Courses retrieved:', courses); // Log the courses
      // Extract only the course names and send them
      const courseNames = courses.map(course => course.courseName);
      res.send(courseNames); //Send back an array of courseNames
    })
    .catch(err => {
      console.error('Error retrieving courses:', err); 
      res.status(500).send('Error retrieving courses');
    });
});


app.get('/highlandgreens', (req, res) => {
  // Find the course by name "HighLand Greens" in the Courses collection
  Courses.findOne({ courseName: "HighLand Greens" })
    .then(course => {
      if (!course) {
        // If course not found, respond with an error
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
