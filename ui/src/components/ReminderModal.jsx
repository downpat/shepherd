import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dreamerService from '../services/DreamerService.js'

/**
 * ReminderModal - Dream reminder functionality
 * Allows users to set email reminders to return to their dreams
 */
function ReminderModal({ onClose }) {
  const [formState, setFormState] = useState('form') // 'form', 'loading', 'success', 'error'
  const [email, setEmail] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [errors, setErrors] = useState([])
  const [tempToken, setTempToken] = useState('')

  // Get default date (tomorrow) and time (9:00 AM)
  const getDefaultDateTime = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultDate = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD format
    const defaultTime = '09:00'
    return { defaultDate, defaultTime }
  }

  // Initialize with default values
  React.useEffect(() => {
    const { defaultDate, defaultTime } = getDefaultDateTime()
    setReminderDate(defaultDate)
    setReminderTime(defaultTime)
  }, [])

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleDateChange = (e) => {
    setReminderDate(e.target.value)
  }

  const handleTimeChange = (e) => {
    setReminderTime(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormState('loading')
    setErrors([])

    try {
      const result = await dreamerService.createIntroDreamer(email, reminderDate, reminderTime)
      
      if (result.success) {
        setTempToken(result.tempToken)
        setFormState('success')
      } else {
        setErrors(result.errors)
        setFormState('error')
      }
    } catch (error) {
      console.error('Reminder creation failed:', error)
      setErrors(['Something went wrong. Please try again.'])
      setFormState('error')
    }
  }

  const handleTryAgain = () => {
    setFormState('form')
    setErrors([])
  }

  const formatReminderDateTime = () => {
    if (!reminderDate || !reminderTime) return ''
    
    const dateObj = new Date(`${reminderDate}T${reminderTime}`)
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }
    return dateObj.toLocaleDateString('en-US', options)
  }

  return (
    <div className="p-8 w-full h-full flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {formState === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold shepherd-dark-blue mb-2">
              Set Dream Reminder
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              I'll send you a gentle reminder to return to your dream when it's convenient for you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium shepherd-dark-blue mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reminderDate" className="block text-sm font-medium shepherd-dark-blue mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    id="reminderDate"
                    value={reminderDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reminderTime" className="block text-sm font-medium shepherd-dark-blue mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    id="reminderTime"
                    value={reminderTime}
                    onChange={handleTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Reminder Preview */}
              {reminderDate && reminderTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Reminder scheduled for:</span><br />
                    {formatReminderDateTime()}
                  </p>
                </div>
              )}

              {/* Submit Button - Using Shepherd Blue */}
              <button
                type="submit"
                className="w-full shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-3 px-4 rounded-lg transition-colors transform hover:scale-105 active:scale-95"
              >
                Set My Reminder
              </button>
            </form>
          </motion.div>
        )}

        {formState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-8"
          >
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold shepherd-dark-blue mb-2">Setting up your reminder...</h3>
            <p className="text-gray-600 text-sm">This will only take a moment</p>
          </motion.div>
        )}

        {formState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-4"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold shepherd-dark-blue mb-2">Reminder Set Successfully!</h3>
            
            <p className="text-gray-600 text-sm mb-4">
              You can safely close DreamShepherd now. Your work is saved and I'll remind you to return at:
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-green-800">
                {formatReminderDateTime()}
              </p>
            </div>

            {/* Display temp token for now */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 mb-1">Your access token (temporary):</p>
              <code className="text-xs font-mono text-gray-800 break-all">{tempToken}</code>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Save this token if you need to return before your reminder arrives.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Perfect! I'm all set
            </button>
          </motion.div>
        )}

        {formState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-4"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold shepherd-dark-blue mb-2">Something went wrong</h3>
            
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <ul className="text-sm text-red-700 text-left">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleTryAgain}
                className="flex-1 shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReminderModal