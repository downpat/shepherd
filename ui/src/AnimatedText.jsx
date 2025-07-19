import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

//Helper component for working with animated text
//Primarily useful for when Shepherd is talking/typing

function AnimatedText({text, textSize, delay = 0, onComplete, clearCursor = true}) {
  const [aText, setAText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  //Run the text animation
  useEffect(() => {
    const startTyping = () => {
      let currentIndex = 0

      //Use setInterval to animate typing, 1 char per 80ms
      const typingInterval = setInterval(() => {
        if (currentIndex <= text.length) {
	  //During the animation, add a char every interval
          setAText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typingInterval)

	  //If clearCursor is true, clear the cursor when typing completes
          if (clearCursor) {
            setShowCursor(false)
          }

	  //Run the callback when typing completes
          if (onComplete) {
            onComplete()
          }
        }
      }, 80)
      
      return () => clearInterval(typingInterval)
    }

    //Don't start the animation until the delay is complete
    const delayTimer = setTimeout(startTyping, delay)
    
    //Clear the delay timeout after useEffect is finished
    return () => clearTimeout(delayTimer)
  }, [text, delay, onComplete])

  //Use different Tailwind/CSS classes depending on textSize prop
  const getTextSizeClasses = () => {
    switch(textSize) {
      case 'title':
        return 'text-6xl font-bold shepherd-dark-blue leading-tight'
      case 'subtitle':
        return 'text-3xl font-semibold shepherd-dark-blue leading-relaxed'
      case 'paragraph':
        return 'text-lg font-normal shepherd-dark-blue leading-normal'
      default:
        return 'text-6xl font-bold shepherd-dark-blue leading-tight'
    }
  }

  return (
    <AnimatePresence>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={getTextSizeClasses()}
      >
        {aText}
        {showCursor && <span className="animate-pulse shepherd-blue">|</span>}
      </motion.h1>
    </AnimatePresence>
  )
}

export default AnimatedText
