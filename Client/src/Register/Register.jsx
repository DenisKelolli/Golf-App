import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const navigate = useNavigate(); // Hook to navigate

  const handleChange = (e) => {
    const updatedFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(updatedFormData);
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordsMatch(updatedFormData.password === updatedFormData.confirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setMessage("Passwords don't match!");
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/register', formData);
      if (response.data.usernameExists) {
        setMessage('Username already exists. Please choose a different username.');
      } else {
        setMessage('Registration successful!');
        // Navigate to /signin
        navigate('/signin');
      }
    } catch (error) {
      setMessage('Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h1 className="register-heading">Register</h1>
        <label className="register-label">
          Name:
          <input type="text" name="name" className="register-input" value={formData.name} onChange={handleChange} required />
        </label>
        <label className="register-label">
          Username:
          <input type="text" name="username" className="register-input" value={formData.username} onChange={handleChange} required />
        </label>
        <label className="register-label">
          Password:
          <input type="password" name="password" className="register-input" value={formData.password} onChange={handleChange} required />
        </label>
        <label className="register-label">
          Confirm Password:
          <input type="password" name="confirmPassword" className="register-input" value={formData.confirmPassword} onChange={handleChange} required />
          {!passwordsMatch && <span className="password-mismatch">Passwords don't match!</span>}
        </label>
        <button type="submit" className="register-button">Register</button>
      </form>
      {message && <div className="register-message">{message}</div>}
    </div>
  );
};

export default Register;
