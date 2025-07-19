import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Intro from './Intro.jsx'
import DreamEditor from './components/DreamEditor.jsx'

function DreamShepherd() {
  return (
    <Router>
      <Routes>
        {/* Intro page at root */}
        <Route path="/" element={<Intro />} />

        {/* Dream creation/editing routes */}
        <Route path="/dream/:slug" element={<DreamEditor />} />
      </Routes>
    </Router>
  )
}

export default DreamShepherd
