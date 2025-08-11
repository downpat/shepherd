import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedText from './AnimatedText.jsx'

/**
 * Shepherd - Ubiquitous guidance component
 * Provides contextual guidance throughout the application
 * Appears at the top as a gentleman - present but unobtrusive
 */
function Shepherd({
  isOpen,
  onToggle,
  script = [{ message: '', submessage: '' }], // Array of message objects with optional actions
  animationType = 'fade', // 'fade', 'type', or 'none'
  onMessageComplete = null
}) {
  const [showSubmessage, setShowSubmessage] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [timer, setTimer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalRenderFunction, setModalRenderFunction] = useState(null)
  const [hasBeenSeen, setHasBeenSeen] = useState(false)

  const currentMessage = script[currentIndex] || { message: '', submessage: '' }

  // Determine if staff should glow - when closed, has content, and hasn't been seen yet
  const shouldGlow = !isOpen && (currentMessage.message || script.length > 0) && !hasBeenSeen

  // Calculate timer duration based on text length (1 second per 10 characters)
  const calculateTimerDuration = (message) => {
    const fullText = message.message + (message.submessage || '')
    return Math.max(2000, Math.floor(fullText.length / 10) * 1000) // Minimum 2 seconds
  }

  // Auto-cycle to next message
  const cycleToNext = () => {
    if (script.length > 1) {
      const nextIndex = (currentIndex + 1) % script.length
      setCurrentIndex(nextIndex)
      setShowSubmessage(false)
    }
  }

  // Start timer
  const startTimer = () => {
    if (script.length > 1 && !isHovered && isOpen) {
      const duration = calculateTimerDuration(currentMessage)
      const newTimer = setTimeout(cycleToNext, duration)
      setTimer(newTimer)
    }
  }

  // Stop timer
  const stopTimer = () => {
    if (timer) {
      clearTimeout(timer)
      setTimer(null)
    }
  }


  const handleMessageComplete = () => {
    if (currentMessage.submessage) {
      setShowSubmessage(true)
    }
    if (onMessageComplete) {
      onMessageComplete()
    }
  }

  const handleSubmessageComplete = () => {
    // Keep drawer open for user to read, they can close it manually
  }

  const handlePrevious = () => {
    stopTimer()
    // Wrap to last item if at beginning, otherwise go back one
    const prevIndex = currentIndex === 0 ? script.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    setShowSubmessage(false)
  }

  const handleNext = () => {
    stopTimer()
    // Wrap to first item if at end, otherwise go forward one
    const nextIndex = (currentIndex + 1) % script.length
    setCurrentIndex(nextIndex)
    setShowSubmessage(false)
  }

  // Handle hover events (desktop)
  const handleMouseEnter = () => {
    setIsHovered(true)
    setShowNavigation(true)
    stopTimer()
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    // Keep navigation visible on touch devices
    if (!window.matchMedia('(hover: none)').matches) {
      setShowNavigation(false)
    }
  }

  // Handle touch events (mobile)
  const handleTouchStart = () => {
    setShowNavigation(true)
    stopTimer() // Stop auto-cycling when user touches
  }

  // Handle modal actions
  const handleActionClick = (renderModal) => {
    console.log('handleActionClick called with renderModal function:', typeof renderModal)
    if (renderModal && typeof renderModal === 'function') {
      setModalRenderFunction(() => renderModal) // Store the render function
      setModalOpen(true)
      stopTimer() // Stop auto-cycling when modal opens
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalRenderFunction(null)
    startTimer() // Explicitly restart the timer after modal closes
  }

  // Timer management - start/stop based on hover and open state
  useEffect(() => {
    stopTimer() // Clear any existing timer
    if (isOpen && !isHovered && script.length > 1) {
      startTimer()
    }
    return stopTimer // Cleanup on unmount
  }, [isOpen, isHovered, currentIndex, script])

  // Reset states when drawer closes or mark as seen when opened
  useEffect(() => {
    if (!isOpen) {
      stopTimer()
      setShowSubmessage(false)
      setCurrentIndex(0)
      setIsHovered(false)
      setShowNavigation(false)
    } else {
      // Mark content as seen when Dreamer opens Shepherd
      setHasBeenSeen(true)
    }
  }, [isOpen])

  // Use a stable reference for script content to avoid unnecessary resets
  const scriptContent = JSON.stringify(script)
  
  useEffect(() => {
    console.log('Script content changed - resetting seen state')
    stopTimer()
    setCurrentIndex(0)
    setShowSubmessage(false)
    setIsHovered(false)
    setShowNavigation(false)
    // Reset seen state for new content
    setHasBeenSeen(false)
  }, [scriptContent])

  // Show navigation initially on touch devices if multiple messages
  useEffect(() => {
    if (isOpen && script.length > 1 && window.matchMedia('(hover: none)').matches) {
      setShowNavigation(true)
    }
  }, [isOpen, script])

  // Debug logging - only when state changes
  useEffect(() => {
    console.log('Shepherd state changed:', { isOpen, hasBeenSeen, shouldGlow, messageExists: !!currentMessage.message })
  }, [isOpen, hasBeenSeen, shouldGlow])

  const renderContent = () => {
    if (animationType === 'type') {
      return (
        <>
          <AnimatedText
            text={currentMessage.message}
            textSize="title"
            delay={500}
            onComplete={handleMessageComplete}
          />
          {showSubmessage && currentMessage.submessage && (
            <AnimatedText
              text={currentMessage.submessage}
              textSize="subtitle"
              clearCursor={false}
              onComplete={handleSubmessageComplete}
            />
          )}
          {currentMessage.buttonText && currentMessage.renderModal && (
            <button
              onClick={() => handleActionClick(currentMessage.renderModal)}
              className="mt-4 shepherd-dark-blue-bg hover:shepherd-blue-bg text-white px-4 py-2 rounded transition-colors"
            >
              {currentMessage.buttonText}
            </button>
          )}
        </>
      )
    } else if (animationType === 'fade') {
      return (
        <motion.div
          data-testid="shepherd-message"
          key={currentIndex} // Force re-render for fade animation
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col space-y-4"
        >
          <h1 className="text-xl sm:text-2xl font-bold shepherd-dark-blue">
            {currentMessage.message}
          </h1>
          {currentMessage.submessage && (
            <p className="text-base sm:text-lg shepherd-dark-blue opacity-80">
              {currentMessage.submessage}
            </p>
          )}
          {currentMessage.buttonText && currentMessage.renderModal && (
            <button
              onClick={() => handleActionClick(currentMessage.renderModal)}
              className="mt-4 shepherd-dark-blue-bg hover:shepherd-blue-bg text-white px-4 py-2 rounded transition-colors"
            >
              {currentMessage.buttonText}
            </button>
          )}
        </motion.div>
      )
    } else {
      // animationType === 'none'
      return (
        <div className="flex flex-col space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold shepherd-dark-blue">
            {currentMessage.message}
          </h1>
          {currentMessage.submessage && (
            <p className="text-base sm:text-lg shepherd-dark-blue opacity-80">
              {currentMessage.submessage}
            </p>
          )}
          {currentMessage.buttonText && currentMessage.renderModal && (
            <button
              onClick={() => handleActionClick(currentMessage.renderModal)}
              className="mt-4 shepherd-dark-blue-bg hover:shepherd-blue-bg text-white px-4 py-2 rounded transition-colors"
            >
              {currentMessage.buttonText}
            </button>
          )}
        </div>
      )
    }
  }

  // Shepherd's cane icon (stylized staff/cane)
  const ShepherdIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      {/* Shepherd's cane/staff */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2v20M12 2c-1.5 0-3 1-3 2.5S10.5 7 12 7s3-1 3-2.5S13.5 2 12 2zM12 22l-2-2M12 22l2-2"
      />
    </svg>
  )

  return (
    <div className="relative">
      {/* Shepherd content panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-testid="shepherd-panel"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full bg-white border-b border-blue-200/40 shadow-sm"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
          >
            <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-6 sm:pt-8 pb-2">
              {/* Shepherd content with navigation */}
              <div className="flex items-start">
                {/* Previous arrow - show if multiple messages and navigation visible */}
                {script.length > 1 && showNavigation && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handlePrevious}
                    className="flex-shrink-0 mt-2 mr-4 shepherd-dark-blue hover:shepherd-blue transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Previous message"
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                )}

                {/* Shepherd content */}
                <div className="text-left flex-1">
                  {renderContent()}

                  {/* Page indicator for multiple messages - show when navigation visible */}
                  {script.length > 1 && showNavigation && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-center mt-4 space-x-2"
                    >
                      {script.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentIndex ? 'shepherd-blue-bg' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Next arrow - show if multiple messages and navigation visible */}
                {script.length > 1 && showNavigation && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleNext}
                    className="flex-shrink-0 mt-2 ml-4 shepherd-dark-blue hover:shepherd-blue transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Next message"
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle tab - always visible */}
      <div className="w-full flex justify-center">
        <motion.button
          data-testid="shepherd-toggle"
          onClick={onToggle}
          className={`bg-white border rounded-b-lg px-6 py-3 hover:border-slate-300 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] ${
            shouldGlow
              ? 'border-orange-300/60 shadow-lg text-orange-500 ring-2 ring-orange-300/40 ring-opacity-75 animate-pulse'
              : 'border-blue-200/40 shadow-sm text-gray-400 hover:shepherd-blue'
          }`}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? "Close Shepherd" : "Open Shepherd"}
          animate={{
            boxShadow: shouldGlow
              ? ['0 0 12px rgba(251, 146, 60, 0.4)', '0 0 24px rgba(251, 146, 60, 0.6)', '0 0 12px rgba(251, 146, 60, 0.4)']
              : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          transition={{
            boxShadow: {
              duration: 2.5,
              repeat: shouldGlow ? Infinity : 0,
              ease: "easeInOut"
            }
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ShepherdIcon />
          </motion.div>
        </motion.button>
      </div>

      {/* Modal for action components */}
      <AnimatePresence>
        {modalOpen && modalRenderFunction && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={handleModalClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full min-h-[500px]"
              >
              {/* Close button */}
              <div className="flex justify-end p-4 pb-0">
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal content - render the component using the render function */}
              <div className="px-4 pb-4">
                {modalRenderFunction(handleModalClose)}
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Shepherd
