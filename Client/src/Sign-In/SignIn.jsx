import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SignIn.css';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/signin', { username, password }, { withCredentials: true });
      if (response.status === 200) {
        navigate('/courseselection');
        window.location.reload();
      }
    } catch (error) {
      setErrorMessage('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="sign-in-container">
      <h1 className="sign-in-title">Sign In</h1>
      <form className="sign-in-form" onSubmit={handleSignIn}>
        <div className="sign-in-form-group">
          <label htmlFor="username" className="sign-in-label">Username:</label>
          <input type="text" id="username" name="username" className="sign-in-input" required onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="sign-in-form-group">
          <label htmlFor="password" className="sign-in-label">Password:</label>
          <input type="password" id="password" name="password" className="sign-in-input" required onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="sign-in-button">Sign In</button>
      </form>
      {errorMessage && <div className="sign-in-error-message">{errorMessage}</div>}
      <p className="sign-in-register-link">Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
};

export default SignIn;
