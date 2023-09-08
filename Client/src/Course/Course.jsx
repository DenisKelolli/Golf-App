import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./Course.css";

const Course = () => {
    const [holesData, setHolesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const location = useLocation();
    const courseName = location.pathname.slice(1);
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const refreshInterval = setInterval(() => {
            window.location.reload(); 
        }, 60000); // set interval for 60 seconds

        return () => clearInterval(refreshInterval); // clear the interval on component unmount
    }, []);

    const totalScore = (scores) => {
        return scores
            ? scores.reduce((total, score) => total + (score ? parseInt(score, 10) : 0), 0)
            : 0;
    };

    const totalPar = () => {
        return holesData.reduce((total, hole) => total + hole.parNumber, 0);
    };

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

    const handleScoreChange = async (playerName, holeIndex, score) => {
        updateScores(playerName, holeIndex, score);
        try {
            await axios.put(`${import.meta.env.VITE_API}/scoreUpdate`, {
                courseName,
                playerName: playerName,
                holeIndex,
                score: Number(score),
            }, { withCredentials: true });  
        } catch (error) {
            console.error("Error updating score:", error);
        }
    };

    const handleFinishGame = async () => {
        const userConfirmation = window.confirm("Finishing the game erases all scores. Click ok to continue.");
        
        if (!userConfirmation) {
            return;
        }
    
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
            navigate("/history");
        } catch (error) {
            console.error("Error finishing game:", error);
            alert('Failed to finish the game. Please try again.'); // Notifies user about the error.
        }
    };
    
    useEffect(() => {
        fetchPlayers();
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
            setHolesData(response.data.holes);
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
        try {
            const response = await axios.get(`${import.meta.env.VITE_API}/${courseName}/players`, { withCredentials: true });
            const fetchedPlayersData = response.data || [];
            const transformedPlayers = fetchedPlayersData.map(player => ({
                name: player.playerName,
                scores: player.scores,
            }));
    
            if (userName && !transformedPlayers.some(p => p.name === userName)) {
                transformedPlayers.push({ name: userName });
            }
    
            setPlayers(transformedPlayers.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        } catch (error) {
            console.error('Error fetching current players:', error);
        }
    };


    const formatCourseName = (courseName) => {
        switch(courseName) {
            case 'highlandgreens':
                return 'HighLand Greens';
            case 'hawkslandingfront9':
                return 'Hawks Landing Front 9';
            case 'hawkslandingback9':
                return 'Hawks Landing Back 9';
            default:
                return courseName;
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

export default Course;
