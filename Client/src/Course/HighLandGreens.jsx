import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socketIOClient from 'socket.io-client';

const HighLandGreens = () => {
  const [holesData, setHolesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const courseName = 'HighLand Greens';

  // Initialize players state from sessionStorage if it exists
  const [players, setPlayers] = useState(JSON.parse(sessionStorage.getItem('players')) || []);
  
  const socket = useRef();

  const updateScores = (playerName, holeIndex, score) => {
    const playerIndex = players.findIndex(player => player.name === playerName);
    if (playerIndex === -1) {
      console.error(`No player found with name: ${playerName}`);
      return;
    }
    const newPlayers = [...players];
    if (!newPlayers[playerIndex].scores) {
      newPlayers[playerIndex].scores = new Array(9).fill(0);
    }
    newPlayers[playerIndex].scores[holeIndex] = score;
    setPlayers(newPlayers);

    // Save the updated players to sessionStorage
    sessionStorage.setItem('players', JSON.stringify(newPlayers));
  };

  const handleScoreChange = (playerName, holeIndex, score) => {
    updateScores(playerName, holeIndex, score);
    socket.current.emit('scoreUpdate', {
      courseName,
      playerName: playerName,
      holeIndex,
      score: Number(score),
    }); 
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
    // Load players from sessionStorage if they exist
    const savedPlayers = sessionStorage.getItem('players');
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }
    
    socket.current = socketIOClient('http://localhost:3000');

    // Fetch the players when the socket connection is established
    fetchPlayers();

    socket.current.on('newPlayerJoined', (updatedPlayers) => {
      setPlayers(updatedPlayers.sort((a, b) => a.name.localeCompare(b.name)));
    });

    socket.current.on('playerDisconnected', (updatedPlayers) => {
      setPlayers(updatedPlayers.sort((a, b) => a.name.localeCompare(b.name)));
    });

    socket.current.on('scoreUpdate', (gameData) => {
      const { courseName, playerName, holeIndex, score } = gameData;
      if (courseName !== 'HighLand Greens') return;
      updateScores(playerName, holeIndex, score);
    });

    return () => { 
      socket.current.disconnect();
    };
  }, []);
  useEffect(() => {
    if (userName) {
      socket.current.emit('joinCourse', { name: userName });
      fetchPlayers(); // Refetch the players including the current user
    }
  }, [userName]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchHolesData();
      await fetchUserName();
      setLoading(false);
    };

    fetchData();
  }, [courseName]);

 

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
    if (!playersLoading) return;
  
    try {
      const response = await axios.get('http://localhost:3000/highlandgreens/players', { withCredentials: true });
      const fetchedPlayers = response.data || [];
      // Add current user to the fetchedPlayers
      if (userName && !fetchedPlayers.some(player => player.name === userName)) {
        fetchedPlayers.push({ name: userName });
      }
      setPlayers(fetchedPlayers.sort((a, b) => a.name.localeCompare(b.name)));
      console.log("Fetched Players: ", fetchedPlayers);
      setPlayersLoading(false);
    } catch (error) {
      console.error('Error fetching current players:', error);
    }
  };
  

  if (loading || playersLoading) {
    return <div>Loading...</div>;
  }

  if (holesData.length === 0) {
    return null;
  }

  return (
    <div>
      <h1>{courseName}</h1>
      <h2>Welcome, {userName}!</h2>
      <h3>Current Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player.name}</li>
        ))}
      </ul>
      <div>
        <h3>Holes Data:</h3>
        <table>
          <thead>
            <tr>
              <th>Hole</th>
              {holesData.map((hole, index) => (
                <th key={index}>{hole.holeNumber}</th>
              ))}
            </tr>
            <tr>
              <th>Par</th>
              {holesData.map((hole, index) => (
                <th key={index}>{hole.parNumber}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, playerIndex) => (
              <tr key={playerIndex}>
                <td>{player.name}</td>
                {holesData.map((hole, holeIndex) => (
                  <td key={holeIndex}>
                    <input
                      type="number"
                      value={(player.scores && player.scores[holeIndex]) || ''}
                      onChange={e => handleScoreChange(player.name, holeIndex, e.target.value)}
                      readOnly={player.name !== userName}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={handleFinishGame}>Finish Game</button>
    </div>
  );
};

export default HighLandGreens;
