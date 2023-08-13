import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HighLandGreens = () => {
  const [holesData, setHolesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const courseName = 'HighLand Greens';
  const [players, setPlayers] = useState([{ name: 'Player 1', scores: Array(9).fill('') }]);

  useEffect(() => {
    const fetchHolesData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/highlandgreens', { withCredentials: true });
        setHolesData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching holes data:', error);
        setLoading(false);
      }
    };

    const fetchUserName = async () => {
      try {
        const response = await axios.get('http://localhost:3000/getusersname', { withCredentials: true });
        setUserName(response.data.name);
        setPlayers([{ name: response.data.name, scores: Array(9).fill('') }]);
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchHolesData();
    fetchUserName();
  }, []);

  const handleInputChange = (event, playerIndex, holeIndex) => {
    const newPlayers = [...players];
    newPlayers[playerIndex].scores[holeIndex] = event.target.value;
    setPlayers(newPlayers);
  };

  const handleFinishGame = async () => {
    try {
      await axios.post(
        'http://localhost:3000/highlandgreens',
        { courseName, players: [{ playerName: userName, scores: players[0].scores }] },
        { withCredentials: true }
      );
      alert('Game has been saved successfully!');
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Failed to save game. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>HighLand Greens</h1>
      {players.map((player, playerIndex) => (
        <div key={playerIndex}>
          <table>
            <thead>
              <tr>
                <th>Hole Number</th>
                <th>Par Number</th>
                <th>{userName}</th>
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
      <button onClick={handleFinishGame}>Finish Game</button>
    </div>
  );
};

export default HighLandGreens;
