import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./History.css";

const History = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API}/history`);
        setGames(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching the games:", error);
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const formatCourseName = (name) => {
    if (!name) return "";

    switch(name.toLowerCase()) {
      case "highlandgreens":
        return "HighLand Greens";
      case "hawkslandingfront9":
        return "Hawks Landing Front 9";
      case 'hawkslandingback9':
        return 'Hawks Landing Back 9';
      default:
        return name;
    }
  };

  if (loading) {
    return <div className="highlandgreenshistory-loading">Loading...</div>;
  }

  return (
    <div className="highlandgreenshistory-container">
      <h2>Game History</h2>
      <table className="highlandgreenshistory-table">
        <thead>
          <tr>
            <th>Course Name</th>
            <th>Players</th>
            <th>Total Score</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game, gameIndex) => {
            const sortedPlayers = [...game.players].sort((a, b) => {
              const totalScoreA = a.scores.reduce((acc, score) => acc + score, 0);
              const totalScoreB = b.scores.reduce((acc, score) => acc + score, 0);
              return totalScoreA - totalScoreB;
            });

            const lowestScore = sortedPlayers[0].scores.reduce((acc, score) => acc + score, 0);

            return (
              <tr key={`${game.courseName}-${gameIndex}`}>
                <td className='historytd'>{formatCourseName(game.courseName)}</td>
                <td className='historytd'>
                  {sortedPlayers.map((player, playerIndex) => {
                    const playerScore = player.scores.reduce((a, b) => a + b, 0);
                    const isLowest = playerScore === lowestScore;
                    return (
                      <div 
                        className='historydiv' 
                        key={playerIndex} 
                        style={{ marginBottom: playerIndex !== sortedPlayers.length - 1 ? '10px' : '0', color: isLowest ? 'red' : 'inherit' }}
                      >
                        {player.playerName}
                      </div>
                    );
                  })}
                </td>
                <td className='historytd'>
                  {sortedPlayers.map((player, playerIndex) => {
                    const playerScore = player.scores.reduce((a, b) => a + b, 0);
                    const isLowest = playerScore === lowestScore;
                    return (
                      <div 
                        className='historydiv' 
                        key={playerIndex} 
                        style={{ marginBottom: playerIndex !== sortedPlayers.length - 1 ? '10px' : '0', color: isLowest ? 'red' : 'inherit' }}
                      >
                        {playerScore}
                      </div>
                    );
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default History;
