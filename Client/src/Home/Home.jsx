import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <Link to="/signin">
        <button className="home-sign-in-button">Sign-In</button>
      </Link>
    </div>
  );
};

export default Home;
