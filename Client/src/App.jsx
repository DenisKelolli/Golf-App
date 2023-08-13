import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import CourseSelection from './CourseSelection/CourseSelection';
import HighLandGreens from "./Course/HighLandGreens"
import Navbar from "./Shared/Navbar"
import Home from './Home/Home';
import SignIn from './Sign-In/SignIn';
import Register from './Register/Register';
import UserContext from './Context/UserContext';

function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <Navbar />
        <div className="div"></div>
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/signin" element={<SignIn />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/courseselection" element={<CourseSelection />} />
          <Route exact path="/highlandgreens" element={<HighLandGreens />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
