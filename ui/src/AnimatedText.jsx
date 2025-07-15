import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function AnimatedText({text, textSize, delay = 0, onComplete, clearCursor = true}) {
  const [aText, setAText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  console.log('Rendering AnimatedText for '+text);
  useEffect(() => {
    const startTyping = () => {
      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setAText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typingInterval)
          if (clearCursor) {
            setShowCursor(false)
          }
          if (onComplete) {
            onComplete()
          }
        }
      }, 80)
      
      return () => clearInterval(typingInterval)
    }

    const delayTimer = setTimeout(startTyping, delay)
    
    return () => clearTimeout(delayTimer)
  }, [text, delay, onComplete])

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
