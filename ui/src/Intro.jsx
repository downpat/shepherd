import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import AnimatedText from './AnimatedText.jsx'
import { createDream } from './domain/Dream.js'
import dreamService from './services/DreamService.js'

function Intro() {
  ///////////////
  //  State variables and setters
  ///////////////

  //Shepherd Intro state
  const [introComplete, setIntroComplete] = useState(false)
  const [showHeadline, setShowHeadline] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)

  //Shepherd User Input state
  const [showHeader, setShowHeader] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [showInputArea, setShowInputArea] = useState(false)

  //Navigation
  const navigate = useNavigate()

  //Shepherd's script
  const shepherdGreeting = 'Tell me your dream'
  const subGreeting = `A vision of what your life could be, ` +
    `of what you want it to be`

  ///////////////
  //  Event Handlers
  ///////////////

  //Handle the end of Shepherd's opening line
  const handleTitleComplete = useCallback(() => {
    setShowSubtitle(true);
  }, [])

  //Handle the end of Shepherd's clarification
  const handleSubtitleComplete = useCallback(() => {
    setTimeout(() => {
      setIntroComplete(true);
      setShowHeader(true);
      setShowInputArea(true);
    }, 1500);
  }, [])

  //Handles Dreamer clicking "create dream"
  const handleCreateDream = async () => {
    try {
      // Create dream with title from user input
      const newDream = createDream({ title: userInput })
      console.dir(dreamService)
      await dreamService.saveDream(newDream)

      // Navigate to dream editor using the dream's slug
      navigate(`/dream/${newDream.slug}`)
    } catch (error) {
      console.error('Error creating dream:', error)
      // TODO: Add proper error handling UI
    }
  }

  //Kick-off the intro
  useEffect(() => {
    // Start intro with the headline message
    setShowHeadline(true)
  }, [])

  return (
    <div className="min-h-screen bg-white font-mono">
      <AnimatePresence mode="wait">
        {!introComplete ? (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center min-h-screen"
          >
            <div className="text-left max-w-4xl">
              <div className="flex flex-col space-y-4">
		{showHeadline && (
	          <AnimatedText
	            text={shepherdGreeting}
	            textSize={"title"}
	            delay={1500}
	            onComplete={handleTitleComplete}
	          />
		)}
		{showSubtitle && (
	          <AnimatedText
	            text={subGreeting}
	            textSize={"subtitle"}
	            clearCursor={false}
	            onComplete={handleSubtitleComplete}
	          />
		)}
              </div>
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
                    <h1 className="text-2xl font-bold shepherd-dark-blue">Tell me your dream</h1>
                  </div>
                  <p className="text-lg shepherd-dark-blue opacity-80 mt-2 ml-8">
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
                      <div className="flex-1">
                        {userInput && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-900/20 border border-green-400/30 rounded-lg p-4 mb-4"
                          >
                            <div className="flex gap-4">
                              {/* User text on the left */}
                              <div className="flex-1 shepherd-dark-blue whitespace-pre-wrap">
                                {userInput}
                              </div>

                              {/* Create Dream button on the right */}
                              {userInput.length >= 3 && (
                                <motion.div
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.2 }}
                                  className="flex-shrink-0"
                                >
                                  <button
                                    onClick={handleCreateDream}
                                    className="shepherd-small-button"
                                  >
                                    Create Dream
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                        <textarea
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          className="shepherd-intro-textarea"
                          rows="3"
                          autoFocus
                        />
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

export default Intro
