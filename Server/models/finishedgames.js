const mongoose = require("mongoose");

const finishedGamesSchema = new mongoose.Schema({
  courseName: String,
  players: [
    {
      playerName: String, 
      scores: [Number],
    }
  ]
});

const finishedGames = mongoose.model('finishedGames', finishedGamesSchema);

module.exports = finishedGames; 
