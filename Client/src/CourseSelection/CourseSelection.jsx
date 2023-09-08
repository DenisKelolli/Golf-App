import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./CourseSelection.css"
import { useNavigate } from 'react-router-dom';

const CourseSelection = () => {
  const [courses, setCourses] = useState([]);
  const [userName, setUserName] = useState('Default Name'); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API}/courseselection`, { withCredentials: true });
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching the courses:', error);
        setCourses(['Failed to load course']);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
       try {
          const response = await axios.get(`${import.meta.env.VITE_API}/getusersname`, { withCredentials: true });
          console.log("Fetched user data:", response.data);
          if (response.data.name) {
             setUserName(response.data.name);
          }
       } catch (error) {
          console.error('Error fetching the current user:', error);
       }
    };
 
    fetchCurrentUser();
 }, []);

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

  const handleJoinGame = async (courseName) => {
    try {
      await axios.post(`${import.meta.env.VITE_API}/joinGame`, {
        courseName,
        playerName: userName,
      }, { withCredentials: true });
  
      // Navigate programmatically after the async request is completed
      navigate(`/${courseName.toLowerCase().replace(/\s+/g, '')}`);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  return (
    <div className='courseSelection'>
      <h1 className='courseselection-whereareyouplayingtoday'>Where are you playing today?</h1>
      
      {courses.map((course, index) => (
        // Removed <Link> component since we're navigating programmatically
        <button 
          key={index}
          onClick={() => handleJoinGame(course)} 
          className={'Course-Button'} 
          style={{ display: 'block', margin: '20px auto', textAlign: 'center' }}>
          {formatCourseName(course)}
        </button>
      ))}
  
      <h2 className='courseselection-trackyourprogress'>Track Your Progress</h2>
      <div className="courseselection-historybutton-container">
        <Link to="/history">
          <button className='History-Button'>History</button>
        </Link>
      </div>
    </div>
  );
  
};

export default CourseSelection;