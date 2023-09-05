import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserContext from "../Context/UserContext";
import './Navbar.css';

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API}/isAuthenticated`, { withCredentials: true });
        if (response.data.authenticated) {
          const userInfo = await axios.get(`${import.meta.env.VITE_API}/getusersname`, { withCredentials: true });
          setUser({ name: userInfo.data.name }); // Update the user's name in the context
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuthentication();
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_API}/logout`, { withCredentials: true });
      setUser(null);
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <nav className="navbar">
      {user ? (
        <>
          <Link className="navbar-link" to="/courseselection">Courses</Link>
          <Link className="navbar-link" onClick={handleLogout} to="#">Logout</Link>
          <span className="navbar-user">{user.name}</span>
        </>
      ) : null}
    </nav>
  );
};

export default Navbar;
