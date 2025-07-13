import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showHeadline, setShowHeadline] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [headlineText, setHeadlineText] = useState('')
  const [introComplete, setIntroComplete] = useState(false)
  const [showHeader, setShowHeader] = useState(false)
  const [showInputArea, setShowInputArea] = useState(false)
  const [userInput, setUserInput] = useState('')
  
  const fullHeadline = 'Tell me your dream'
  
  useEffect(() => {
    // Start with prompt after brief delay
    const promptTimer = setTimeout(() => setShowPrompt(true), 500)
    
    // Start headline typing after prompt appears
    const headlineTimer = setTimeout(() => setShowHeadline(true), 1500)
    
    return () => {
      clearTimeout(promptTimer)
      clearTimeout(headlineTimer)
    }
  }, [])
  
  useEffect(() => {
    if (showHeadline) {
      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullHeadline.length) {
          setHeadlineText(fullHeadline.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typingInterval)
          // Show subtitle after headline is complete
          setTimeout(() => {
            setShowSubtitle(true)
            // Start fade sequence after subtitle appears
            setTimeout(() => {
              setIntroComplete(true)
              // Fade in header, then input area
              setTimeout(() => setShowHeader(true), 800)
              setTimeout(() => setShowInputArea(true), 1400)
            }, 2000)
          }, 500)
        }
      }, 80)
      
      return () => clearInterval(typingInterval)
    }
  }, [showHeadline])
  
  return (
    <div className="min-h-screen bg-black font-mono">
      <AnimatePresence mode="wait">
        {!introComplete ? (
          // Intro Animation
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center min-h-screen"
          >
            <div className="text-left max-w-4xl">
              <div className="flex items-baseline">
                <AnimatePresence>
                  {showPrompt && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-6xl font-bold text-green-400 mr-4"
                    >
                      <span className="animate-pulse">$</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {showHeadline && (
                    <motion.h1
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-6xl font-bold text-green-400 leading-tight"
                    >
                      {headlineText}
                      <span className="animate-pulse text-green-300">|</span>
                    </motion.h1>
                  )}
                </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {showSubtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-2xl text-green-300 opacity-80 mt-4 ml-20"
                  >
                    A vision of what your life could be, of what you want it to be
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          // Post-Intro Interactive State
          <motion.div
            key="interactive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col"
          >
            {/* Header */}
            <AnimatePresence>
              {showHeader && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="p-8"
                >
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-green-400 mr-2">$</span>
                    <h1 className="text-2xl font-bold text-green-400">Tell me your dream</h1>
                  </div>
                  <p className="text-lg text-green-300 opacity-80 mt-2 ml-8">
                    A vision of what your life could be, of what you want it to be
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Interactive Input Area */}
            <AnimatePresence>
              {showInputArea && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="w-full max-w-2xl px-8">
                    <div className="flex items-start">
                      <span className="text-4xl font-bold text-green-400 mr-4 mt-1">$</span>
                      <div className="flex-1">
                        {userInput && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-900/20 border border-green-400/30 rounded-lg p-4 mb-4"
                          >
                            <div className="text-green-300 whitespace-pre-wrap">
                              {userInput}
                            </div>
                          </motion.div>
                        )}
                        <textarea
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          className="w-full bg-transparent text-green-400 text-xl border-none outline-none resize-none font-mono"
                          rows="3"
                          autoFocus
                        />
                        <div className="text-green-400 text-xl animate-pulse">|</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
