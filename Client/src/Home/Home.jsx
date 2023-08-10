import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome!</h1>
      <Link to="/">
        <button className="sign-in-button">Sign-In</button>
      </Link>
    </div>
  );
};

export default Home;
