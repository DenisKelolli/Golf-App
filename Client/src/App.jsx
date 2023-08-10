import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import CourseSelection from './CourseSelection/CourseSelection';
import HighLandGreens from "./Course/HighLandGreens"
import Navbar from "./Shared/Navbar"
import Home from './Home/Home';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="div"></div>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/courseselection" element={<CourseSelection />} />
        <Route exact path="/highlandgreens" element={<HighLandGreens />} />
      </Routes>
    </Router>
  );
}

export default App;
