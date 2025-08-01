import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import AnimatedText from './AnimatedText.jsx'
import { createDream } from './domain/Dream.js'
import dreamService from './services/DreamService.js'
import { isMobile, generateUUID } from './utils/device.js'

function Intro({ debugMode = false }) {
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
  const [mobileMode, setMobileMode] = useState(false)
  const [isCreatingDream, setIsCreatingDream] = useState(false)

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
      setMobileMode(isMobile());
    }, 1500);
  }, [])

  //Handle mobile fake focus click
  const handleMobileFocusClick = () => {
    // Show the real textarea for mobile input
    setMobileMode(false)
  }

  //Handles Dreamer clicking "create dream"
  const handleCreateDream = async () => {
    try {
      setIsCreatingDream(true)

      // Create dream with generated UUID and title from user input
      const newDream = createDream({
        id: generateUUID(),
        title: userInput
      })
      await dreamService.saveDream(newDream)

      // Add a brief pause to ensure finger lifts and prevent mobile autofocus
      await new Promise(resolve => setTimeout(resolve, 1600))

      // Navigate to dream editor using the dream's slug
      navigate(`/dream/${newDream.slug}`)
    } catch (error) {
      console.error('Error creating dream:', error)
      setIsCreatingDream(false)
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
            <div className="text-left max-w-4xl px-6 sm:px-0">
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
                  className="p-6 sm:p-8"
                >
                  <div className="flex items-baseline">
                    <h1 className="text-xl sm:text-2xl font-bold shepherd-dark-blue">Tell me your dream</h1>
                  </div>
                  <p className="text-base sm:text-lg shepherd-dark-blue opacity-80 mt-2 ml-4 sm:ml-8">
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
                  <div className="w-full max-w-2xl px-6 sm:px-8">
                    <div className="flex items-start">
                      <div className="flex-1">
                        {/* Dream Solidification Container - forms around text as they type */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`relative rounded-lg border transition-all duration-500 ${
                            userInput.length >= 3
                              ? 'bg-blue-50/30 border-blue-300/40 shadow-sm p-4'
                              : 'bg-transparent border-transparent p-0'
                          }`}
                        >
                          <div className={`flex ${userInput.length >= 3 ? 'flex-col sm:flex-row gap-4' : ''}`}>
                            {/* Input Area - Desktop textarea or Mobile fake focus */}
                            <div className="flex-1">
                              {mobileMode ? (
                                <div
                                  onClick={handleMobileFocusClick}
                                  className="w-full bg-transparent shepherd-dark-blue text-xl sm:text-2xl lg:text-3xl border-none outline-none resize-none font-semibold min-h-[3rem] cursor-text"
                                >
                                  <span className="shepherd-blue animate-pulse">|</span>
                                </div>
                              ) : (
                                <textarea
                                  value={userInput}
                                  onChange={(e) => setUserInput(e.target.value)}
                                  className="w-full bg-transparent shepherd-dark-blue text-xl sm:text-2xl lg:text-3xl border-none outline-none resize-none font-semibold shepherd-blue-cursor min-h-[3rem]"
                                  rows="3"
                                  autoFocus
                                />
                              )}
                            </div>

                            {/* Create Dream button - appears when dream solidifies */}
                            {userInput.length >= 3 && (
                              <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex-shrink-0 self-start"
                              >
                                <motion.button
                                  onClick={handleCreateDream}
                                  onTouchEnd={handleCreateDream}
                                  disabled={isCreatingDream}
                                  className={`shepherd-small-button w-full sm:w-auto touch-manipulation transition-all ${
                                    isCreatingDream ? 'bg-blue-500 cursor-not-allowed' : 'hover:bg-blue-700'
                                  }`}
                                  style={{ WebkitTapHighlightColor: 'transparent' }}
                                  animate={isCreatingDream ? { scale: [1, 1.05, 1] } : {}}
                                  transition={{ duration: 0.6, repeat: isCreatingDream ? Infinity : 0 }}
                                >
                                  {isCreatingDream ? '✨ Creating...' : 'Create Dream'}
                                </motion.button>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
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
