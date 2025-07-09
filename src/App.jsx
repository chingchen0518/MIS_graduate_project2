import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Attraction_container from './view2/attraction_container.jsx'
import HomePage from './components/homepage.jsx'

// import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/attraction" element={<Attraction_container />} />
      </Routes>
    </Router>


  )
}

export default App
