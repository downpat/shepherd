import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Intro from './Intro.jsx'
import DreamEditor from './components/DreamEditor.jsx'

// Global debug mode configuration
const DEBUG_MODE = true

function DreamShepherd() {
  return (
    <Router>
      <Routes>
        {/* Intro page at root */}
        <Route path="/" element={<Intro debugMode={DEBUG_MODE} />} />

        {/* Dream creation/editing routes */}
        <Route path="/dream/:slug" element={<DreamEditor debugMode={DEBUG_MODE} />} />
      </Routes>
    </Router>
  )
}

export default DreamShepherd
