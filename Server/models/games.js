const mongoose = require("mongoose");

const gamesSchema = new mongoose.Schema({
    courseName: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses' },
    players: [
      {
        playerName: String,
        scores: [Number],
      }
    ]
  });

  const Games = mongoose.model('Games', gamesSchema);

module.exports = Games; 
