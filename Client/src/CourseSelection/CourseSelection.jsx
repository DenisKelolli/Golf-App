import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./CourseSelection.css"

const CourseSelection = () => {
  const [courses, setCourses] = useState([]);

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
    <div className='courseSelection'>
      <h1 className='courseselection-whereareyouplayingtoday'>Where are you playing today?</h1>
      
      {courses.map((course, index) => (
        <Link key={index} to={`/${course.toLowerCase().replace(/\s+/g, '')}`}>
          <button className={'Course-Button'} style={{ display: 'block', margin: '20px auto', textAlign: 'center' }}>
            {formatCourseName(course)}
          </button>
        </Link>
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
