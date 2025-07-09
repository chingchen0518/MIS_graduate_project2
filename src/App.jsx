import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import InteractiveMap from './view2/Liu/map/InteractiveMap.jsx'
import Attraction_container from './view2/chingchen/attraction_container.jsx'
import HomePage from './components/homepage.jsx'
import Page1 from './view2/chingchen/page1.jsx'

// import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/attraction" element={<Attraction_container />} />
        <Route path="/map" element={<InteractiveMap />} />
        <Route path="/page1" element={<Page1 />} />
        {/* <Route path="/attraction" element={<Attraction_container />} /> */}

      </Routes>
    </Router>
  )
}

export default App
