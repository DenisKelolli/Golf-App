import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HighLandGreens = () => {
  const [holesData, setHolesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([
    { name: 'Player 1', scores: Array(9).fill('') },
    { name: 'Player 2', scores: Array(9).fill('') },
    // Add more players as needed
  ]);

  useEffect(() => {
    const fetchHolesData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/highlandgreens');
        setHolesData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching holes data:', error);
        setLoading(false);
      }
    };

    fetchHolesData();
  }, []);

  const handleInputChange = (event, playerIndex, holeIndex) => {
    const newPlayers = [...players];
    newPlayers[playerIndex].scores[holeIndex] = event.target.value;
    setPlayers(newPlayers);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>HighLand Greens</h1>
      {players.map((player, playerIndex) => (
        <div key={playerIndex}>
          <h3>{player.name}</h3>
          <table>
            <thead>
              <tr>
                <th>Hole Number</th>
                <th>Par Number</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {holesData.map((hole, holeIndex) => (
                <tr key={holeIndex}>
                  <td>{hole.holeNumber}</td>
                  <td>{hole.parNumber}</td>
                  <td>
                    <input
                      type="number"
                      value={player.scores[holeIndex]}
                      onChange={e => handleInputChange(e, playerIndex, holeIndex)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default HighLandGreens;
