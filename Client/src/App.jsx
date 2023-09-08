import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './App.css';
import CourseSelection from './CourseSelection/CourseSelection';
import Course from "./Course/Course";
import Navbar from "./Shared/Navbar";
import SignIn from './Sign-In/SignIn';
import Register from './Register/Register';
import UserContext from './Context/UserContext';
import History from './History/History';

function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <Navbar />
        <div className="div"></div>
        <Routes>
          <Route exact path="/" element={<Navigate to="/signin" />} /> 
          <Route exact path="/signin" element={<SignIn />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/courseselection" element={<CourseSelection />} />
          <Route exact path="/history" element={<History />} />
          <Route exact path="/:courseName" element={<Course />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
