import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketIOClient from 'socket.io-client';

const HighLandGreens = () => {
  const [holesData, setHolesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const courseName = 'HighLand Greens';
  const [players, setPlayers] = useState([]);
  const socket = socketIOClient('http://localhost:3000');

  const updateScores = (playerIndex, holeIndex, score) => {
    const newPlayers = [...players];
    newPlayers[playerIndex].scores[holeIndex] = score;
    setPlayers(newPlayers);
  };

  const handleFinishGame = async () => {
    try {
      const playersData = players.map(player => ({
        playerName: player.name,
        scores: player.scores,
      }));
      await axios.post(
        'http://localhost:3000/highlandgreens',
        { courseName, players: playersData },
        { withCredentials: true }
      );
      alert('Game has been saved successfully!');
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Failed to save game. Please try again.');
    }
  };


  useEffect(() => {
    const fetchHolesData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/highlandgreens', { withCredentials: true });
        setHolesData(response.data);
      } catch (error) {
        console.error('Error fetching holes data:', error);
      }
    };

    const fetchUserName = async () => {
      try {
        const response = await axios.get('http://localhost:3000/getusersname', { withCredentials: true });
        setUserName(response.data.name);
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    const fetchPlayers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/highlandgreens/players', { withCredentials: true });
        setPlayers(response.data);
      } catch (error) {
        console.error('Error fetching current players:', error);
      }
    };

    fetchHolesData();
    fetchUserName();
    fetchPlayers();
    setLoading(false);

    // Emit the 'joinCourse' event after all listeners are set up
    if (userName) {
      const player = { name: userName };
      socket.emit('joinCourse', player);
    }

    socket.on('newPlayerJoined', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('playerDisconnected', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('scoreUpdate', (gameData) => {
      const { playerIndex, holeIndex, score } = gameData;
      updateScores(playerIndex, holeIndex, score);
    });


  }, [userName]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Render component contents only if holesData is populated
  if (holesData.length === 0) {
    return null;
  }

  return (
    <div>
      <h1>{courseName}</h1>
      <h2>Welcome, {userName}!</h2>
      <div>
        <h3>Current Players:</h3>
        <ul>
          {players.map((player) => (
            <li key={player.name}>{player.name}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleFinishGame}>Finish Game</button>
    </div>
  );
};

export default HighLandGreens;
