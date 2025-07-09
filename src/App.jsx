import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Attraction_container from './view2/attraction_container.jsx'
import InteractiveMap from './view2/Liu/map/InteractiveMap.jsx'

import HomePage from './components/homepage.jsx'

// import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/attraction" element={<Attraction_container />} />
        <Route path="/map" element={<InteractiveMap />} />
      </Routes>
    </Router>
  )
}

export default App
