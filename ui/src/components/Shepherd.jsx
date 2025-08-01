import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedText from '../AnimatedText.jsx'

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
  const [timer, setTimer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalComponent, setModalComponent] = useState(null)

  const currentMessage = script[currentIndex] || { message: '', submessage: '' }

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

  // Handle hover events
  const handleMouseEnter = () => {
    setIsHovered(true)
    stopTimer()
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Handle modal actions
  const handleActionClick = (component) => {
    console.log('handleActionClick called with:', component)
    if (component) {
      setModalComponent(component)
      setModalOpen(true)
      stopTimer() // Stop auto-cycling when modal opens
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalComponent(null)
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

  // Reset states when drawer closes or script changes
  useEffect(() => {
    if (!isOpen) {
      stopTimer()
      setShowSubmessage(false)
      setCurrentIndex(0)
      setIsHovered(false)
    }
  }, [isOpen])

  useEffect(() => {
    stopTimer()
    setCurrentIndex(0)
    setShowSubmessage(false)
    setIsHovered(false)
  }, [script])

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
          {currentMessage.buttonText && currentMessage.component && (
            <button
              onClick={() => handleActionClick(currentMessage.component)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              {currentMessage.buttonText}
            </button>
          )}
        </>
      )
    } else if (animationType === 'fade') {
      return (
        <motion.div
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
          {currentMessage.buttonText && currentMessage.component && (
            <button
              onClick={() => handleActionClick(currentMessage.component)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
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
          {currentMessage.buttonText && currentMessage.component && (
            <button
              onClick={() => handleActionClick(currentMessage.component)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
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
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full bg-white border-b border-blue-200/40 shadow-sm"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-6 sm:pt-8 pb-2">
              {/* Shepherd content with navigation */}
              <div className="flex items-start">
                {/* Previous arrow - show if multiple messages and hovered */}
                {script.length > 1 && isHovered && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handlePrevious}
                    className="flex-shrink-0 mt-2 mr-4 shepherd-dark-blue hover:text-blue-600 transition-colors"
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

                  {/* Page indicator for multiple messages - only show when hovered */}
                  {script.length > 1 && isHovered && (
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
                            index === currentIndex ? 'bg-blue-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Next arrow - show if multiple messages and hovered */}
                {script.length > 1 && isHovered && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleNext}
                    className="flex-shrink-0 mt-2 ml-4 shepherd-dark-blue hover:text-blue-600 transition-colors"
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
          onClick={onToggle}
          className="bg-white border border-blue-200/40 shadow-sm rounded-b-lg px-4 py-2 text-gray-400 hover:text-blue-500 hover:border-blue-300/60 transition-all duration-200"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? "Close Shepherd" : "Open Shepherd"}
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
        {modalOpen && modalComponent && (
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
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
              
              {/* Modal content */}
              <div className="px-4 pb-4">
                {modalComponent && (() => {
                  const Component = modalComponent
                  return <Component onClose={handleModalClose} />
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Shepherd
