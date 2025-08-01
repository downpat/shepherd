import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import Intro from './Intro.jsx'
import DreamEditor from './components/DreamEditor.jsx'
import dreamService from './services/DreamService.js'
import dreamerService from './services/DreamerService.js'

// Global debug mode configuration
const DEBUG_MODE = true

function DreamShepherd() {
  const [dreamer, setDreamer] = useState({})

  useEffect(() => {
    const initAll = async () => {
      setDreamer(await dreamerService.getDreamer())
      await dreamService.init()
    }

    initAll();
  }, [])

  // Show loading spinner while checking authentication
  if (!dreamer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">
          {/* TODO: Replace with proper Shepherd-style loading animation */}
          Awakening...
        </div>
      </div>
    )
  }

  // Routing logic based on user state
  const getDefaultRoute = () => {
    if (dreamer.type === 'normal') {
      return `/dream/${dreamService.currentDream.slug}`
    }  else {
      // New user - show intro
      return '/'
    }
  }

  return (
    <Router>
      <Routes>
        {/* Root route - conditional based on user state */}
        <Route
          path="/"
          element={
            dreamer.type === 'normal' ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Intro
                debugMode={DEBUG_MODE}
              />
            )
          }
        />

        {/* Dream creation/editing routes */}
        <Route path="/dream/:slug" element={<DreamEditor debugMode={DEBUG_MODE} />} />

        {/* TODO: Add additional routes */}
        {/* <Route path="/dreams" element={<DreamsDashboard />} /> */}
        {/* <Route path="/login" element={<Login />} /> */}
      </Routes>
    </Router>
  )
}

export default DreamShepherd
