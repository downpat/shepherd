import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function AnimatedText({text, textSize, delay = 0, onComplete}) {
  const [aText, setAText] = useState('')

  useEffect(() => {
    const startTyping = () => {
      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setAText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typingInterval)
          if (onComplete) {
            onComplete()
          }
        }
      }, 80)
      
      return () => clearInterval(typingInterval)
    }

    const delayTimer = setTimeout(startTyping, delay)
    
    return () => clearTimeout(delayTimer)
  }, [delay, onComplete])

  const getTextSizeClasses = () => {
    switch(textSize) {
      case 'title':
        return 'text-6xl font-bold text-blue-900 leading-tight'
      case 'subtitle':
        return 'text-3xl font-semibold text-blue-900 leading-relaxed'
      case 'paragraph':
        return 'text-lg font-normal text-blue-900 leading-normal'
      default:
        return 'text-6xl font-bold text-blue-900 leading-tight'
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
        <span className="animate-pulse text-blue-800">|</span>
      </motion.h1>
    </AnimatePresence>
  )
}

export default AnimatedText
