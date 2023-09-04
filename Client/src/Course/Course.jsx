import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import "./Course.css"

const HighLandGreens = () => {
  const [holesData, setHolesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const location = useLocation();
  const courseName = location.pathname.slice(1); // this will remove the leading slash and get the rest, for example: "highlandgreens" from "/highlandgreens"
  console.log(courseName)
  const [players, setPlayers] = useState([]);

  const socket = useRef();

  const totalScore = (scores) => {
    return scores ? scores.reduce((a, b) => a + (b || 0), 0) : 0;
  };

  const totalPar = () => {
    return holesData.reduce((total, hole) => total + hole.parNumber, 0);
  };


  useEffect(() => {
    socket.current = socketIOClient('http://localhost:3000');
  
    socket.current.on('newPlayerJoined', () => {
      fetchPlayers(); // Refetch players on any join event
    });
  
    socket.current.on('updatedPlayersList', (updatedPlayers) => {
      setPlayers(updatedPlayers);
  });

    socket.current.on('playerData', (incomingPlayer) => {
      // Extract necessary properties from incoming player
      const { name, scores } = incomingPlayer;
    
      // Check if this player already exists in local state
      const existingPlayerIndex = players.findIndex(p => p.name === name);
    
      const updatedPlayers = [...players];
    
      // If player exists, update scores
      if (existingPlayerIndex > -1) {
        updatedPlayers[existingPlayerIndex].scores = scores;
      } else {
        // If not, add the new player to the list
        updatedPlayers.push(incomingPlayer);
      }
    
      // Sort players by name and update state 
      setPlayers(updatedPlayers.sort((a, b) => a.name.localeCompare(b.name)));
      
    });
    
    socket.current.on('scoreUpdate', (data) => {
      const updatedPlayers = data.players;
      if (!updatedPlayers) return;
    
      // Rename playerName to name
      updatedPlayers.forEach(player => {
        player.name = player.playerName;
        delete player.playerName;
      });
    
      // Add current user to the players if not already present
      if (userName && !updatedPlayers.some(player => player.name === userName)) {
        updatedPlayers.push({ name: userName });
      }
    
      // Sort by name and update the state
      setPlayers(updatedPlayers.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    
    });
    
  
    // Fetch players when the component mounts
    fetchPlayers();
  
    return () => {
      socket.current.disconnect();
    };
  }, []);

  const updateScores = (playerName, holeIndex, score) => {
    const playerIndex = players.findIndex(player => player.name === playerName);
    if (playerIndex === -1) {
      console.error(`No player found with name: ${playerName}`);
      return;
    }
    const newPlayers = [...players];
    if (!newPlayers[playerIndex].scores) {
      newPlayers[playerIndex].scores = [];
    }
    newPlayers[playerIndex].scores[holeIndex] = score;
    setPlayers(newPlayers);
  
  };
  

  const handleScoreChange = (playerName, holeIndex, score) => {
  updateScores(playerName, holeIndex, score);
  // emit the score update
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
            `${import.meta.env.VITE_API}/${courseName}`,
            { courseName, players: playersData },
            { withCredentials: true }
        );

        // Reset scores for each player after successful save
        players.forEach(player => {
            player.scores = [];
        });

        alert('Game has been saved successfully!');
    } catch (error) {
        console.error('Error saving game:', error);
        alert('Failed to save game. Please try again.');
    }
};


  useEffect(() => {
    if (userName) {
      socket.current.emit('joinCourse', { name: userName, courseName });
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
      const response = await axios.get(`${import.meta.env.VITE_API}/${courseName}`, { withCredentials: true });
      setHolesData(response.data.holes); // Accessing the holes property of the response
    } catch (error) {
      console.error('Error fetching holes data:', error);
    }
  };

  const fetchUserName = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/getusersname`, { withCredentials: true });
      setUserName(response.data.name);
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchPlayers = async () => {
    if (!playersLoading) return;
  
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}/${courseName}/players`, { withCredentials: true });
      const fetchedPlayers = response.data || [];
  
      // Add current user to the players
      if (userName && !fetchedPlayers.some(player => player.name === userName)) {
        fetchedPlayers.push({ name: userName });
      }
      setPlayers(fetchedPlayers.sort((a, b) => a.name.localeCompare(b.name)));
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

  const formatCourseName = (courseName) => {
    switch(courseName) {
      case 'highlandgreens':
        return 'HighLand Greens';
      case 'hawkslandingfront9':
        return 'Hawks Landing Front 9';
      case 'hawkslandingback9':
        return 'Hawks Landing Back 9';
      default:
        return courseName;  // if the courseName is neither of the two, just return it unchanged
    }
  };
  

  return (
    <div className='highlandgreens'>
        <h1 className='highlandgreens-coursname'>{formatCourseName(courseName)}</h1>
        <div className="highlandgreens-scorecardContainer">
            <table>
                <thead>
                    <tr>
                        <th>Hole</th>
                        {holesData.map((hole, index) => (
                            <th key={index}>#{hole.holeNumber}</th>
                        ))}
                        <th>Total Score</th> 
                    </tr>
                    <tr>
                        <th>Par</th>
                        {holesData.map((hole, index) => (
                            <th key={index}>{hole.parNumber}</th>
                        ))}
                        <th>{totalPar()}</th> 
                    </tr>
                </thead>
                <tbody>
                    {players.map((player, playerIndex) => (
                        <tr key={playerIndex} className={player.name === userName ? 'highlandgreens-currentPlayer' : ''}>
                            <td>{player.name}</td>
                            {holesData.map((hole, holeIndex) => (
                                <td key={holeIndex} className={player.name === userName ? 'highlandgreens-currentPlayer-cell' : ''}>
                                    <input
                                        className="highlandgreens-score-input-full"
                                        type="tel"
                                        pattern="[0-9]*"
                                        value={(player.scores && player.scores[holeIndex]) || ''}
                                        onChange={e => handleScoreChange(player.name, holeIndex, e.target.value)}
                                        readOnly={player.name !== userName}
                                        style={{
                                            color:
                                                player.scores && player.scores[holeIndex] < hole.parNumber
                                                    ? 'green'
                                                    : player.scores && player.scores[holeIndex] === hole.parNumber
                                                    ? 'blue'
                                                    : 'red',
                                            fontSize: '18px',
                                            backgroundColor: player.name === userName ? 'rgb(238, 233, 233)' : 'white',
                                        }}
                                    />
                                </td>
                            ))}
                            <td style={{
                                color: totalScore(player.scores) < totalPar()
                                    ? 'green'
                                    : totalScore(player.scores) === totalPar()
                                    ? 'blue'
                                    : 'red',
                                fontSize: '18px',
                            }}>{totalScore(player.scores)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
         <button className='highlandgreens-finishgame-button' onClick={handleFinishGame}>Finish Game</button>
    </div>
);

};

export default HighLandGreens;
