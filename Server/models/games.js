const mongoose = require("mongoose");

const gamesSchema = new mongoose.Schema({
  courseName: String,
  players: [
    {
      playerName: String, 
      scores: [Number],
    }
  ]
});

const Games = mongoose.model('Games', gamesSchema);

module.exports = Games; 
