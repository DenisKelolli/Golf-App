import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./CourseSelection.css"

const CourseSelection = () => {
  const [courseName, setCourseName] = useState('Loading...');

  useEffect(() => {
    const fetchCourseName = async () => {
      try {
        const response = await axios.get('http://localhost:3000/courseselection', { withCredentials: true });
        setCourseName(response.data[0]);
      } catch (error) {
        console.error('Error fetching the course name:', error);
        setCourseName('Failed to load course');
      }
    };

    fetchCourseName();
  }, []);

  return (
    <div>
      <h1>Where are you playing today?</h1>
      <Link to="/highlandgreens">
        <button className='HighLandGreens-Button' style={{ display: 'block', margin: 'auto', textAlign: 'center' }}>
          {courseName}
        </button>
      </Link>
    </div>
  );
};

export default CourseSelection;
