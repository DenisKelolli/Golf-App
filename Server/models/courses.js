const mongoose = require("mongoose");

const coursesSchema = new mongoose.Schema({
    courseName: String,
    holes: [
      {
        holeNumber: Number,
        parNumber: Number,
      }
    ],
  });

const Courses = mongoose.model('Courses', coursesSchema);

module.exports = Courses; 
