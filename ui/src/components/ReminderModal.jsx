import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dreamService from '../services/DreamService.js'
import dreamerService from '../services/DreamerService.js'
import { createDreamReminderPackage, validateReminderDate } from '../utils/calendar.js'

/**
 * ReminderModal - Dream reminder functionality
 * Creates calendar reminders with embedded return URLs - email optional
 */
function ReminderModal({ onClose }) {
  const [formState, setFormState] = useState('form') // 'form', 'email', 'loading', 'success', 'error'
  const [email, setEmail] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [errors, setErrors] = useState([])
  const [tempToken, setTempToken] = useState('')
  const [returnUrl, setReturnUrl] = useState('')
  const [reminderMethod, setReminderMethod] = useState('') // 'email', 'google', 'outlook', 'apple', 'ics'

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

  const handleEmailOption = () => {
    setReminderMethod('email')
    setFormState('email')
  }

  const handleCalendarOption = async (method) => {
    setReminderMethod(method)
    setFormState('loading')

    try {
      // Get current dreamer for tempToken
      const dreamer = await dreamerService.getDreamer()
      if (!dreamer || dreamer.type === 'anonymous') {
        setErrors(['Please create your dream first before setting reminders.'])
        setFormState('error')
        return
      }

      // Create reminder package
      const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`)
      const reminderPackage = createDreamReminderPackage({
        dreamTitle: dreamService.currentDream?.title || 'My Dream',
        tempToken: dreamer.tempToken,
        reminderDate: reminderDateTime
      })

      setReturnUrl(reminderPackage.returnUrl)

      // Handle different calendar methods
      switch (method) {
        case 'google':
          // For Google Calendar, we'll still download the ICS since Google Calendar web doesn't have a direct API
          reminderPackage.download()
          break
        case 'outlook':
          reminderPackage.download()
          break
        case 'apple':
          reminderPackage.download()
          break
        case 'ics':
          reminderPackage.download()
          break
        default:
          throw new Error('Unknown calendar method')
      }

      setFormState('success')
    } catch (error) {
      console.error('Calendar reminder failed:', error)
      setErrors(['Failed to create calendar reminder. Please try again.'])
      setFormState('error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormState('loading')
    setErrors([])

    try {
      // Update existing IntroDreamer with email and save current dream content
      const result = await dreamerService.updateIntroDreamer(
        email,
        dreamService.currentDream?.title || '',
        dreamService.currentDream?.vision || null,
        reminderDate,
        reminderTime
      )

      if (result.success) {
        setTempToken(result.tempToken)
        // Generate return URL
        const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`)
        const reminderPackage = createDreamReminderPackage({
          dreamTitle: dreamService.currentDream?.title || 'My Dream',
          tempToken: result.tempToken,
          reminderDate: reminderDateTime,
          dreamerEmail: email
        })
        setReturnUrl(reminderPackage.returnUrl)
        setFormState('success')
      } else {
        setErrors(result.errors)
        setFormState('error')
      }
    } catch (error) {
      console.error('Email reminder creation failed:', error)
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
            <h2 className="text-4xl font-bold shepherd-dark-blue mb-4">
              Your Presence Here is Requested
            </h2>
            <p className="text-gray-600 mb-8 text-xl">
              Please set a date for your return journey.
            </p>

            <div className="space-y-6">

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reminderDate" className="block text-xl font-medium shepherd-dark-blue mb-3">
                    Date
                  </label>
                  <input
                    type="date"
                    id="reminderDate"
                    value={reminderDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-6 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reminderTime" className="block text-xl font-medium shepherd-dark-blue mb-3">
                    Time
                  </label>
                  <input
                    type="time"
                    id="reminderTime"
                    value={reminderTime}
                    onChange={handleTimeChange}
                    className="w-full px-6 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Reminder Preview */}
              {reminderDate && reminderTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-lg text-blue-800">
                    <span className="font-medium">Reminder scheduled for:</span><br />
                    {formatReminderDateTime()}
                  </p>
                </div>
              )}

              {/* Reminder Method Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleEmailOption}
                    className="shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-4 px-4 text-lg rounded-lg transition-colors"
                  >
                    📧 Email
                  </button>
                  <button
                    onClick={() => handleCalendarOption('google')}
                    className="shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-4 px-4 text-lg rounded-lg transition-colors"
                  >
                    📅 Google Calendar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleCalendarOption('outlook')}
                    className="shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-4 px-4 text-lg rounded-lg transition-colors"
                  >
                    📅 Outlook
                  </button>
                  <button
                    onClick={() => handleCalendarOption('apple')}
                    className="shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-4 px-4 text-lg rounded-lg transition-colors"
                  >
                    📅 Apple Calendar
                  </button>
                  <button
                    onClick={() => handleCalendarOption('ics')}
                    className="shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-4 px-4 text-lg rounded-lg transition-colors"
                  >
                    📅 Calendar .ics
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {formState === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-4xl font-bold shepherd-dark-blue mb-4">
              Your Presence Here is Requested
            </h2>
            <p className="text-gray-600 mb-8 text-xl">
              Please provide your email for the reminder.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xl font-medium shepherd-dark-blue mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full px-6 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>

              {/* Reminder Preview */}
              {reminderDate && reminderTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-lg text-blue-800">
                    <span className="font-medium">Reminder scheduled for:</span><br />
                    {formatReminderDateTime()}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-5 px-6 text-xl rounded-lg transition-colors transform hover:scale-105 active:scale-95"
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
            <h3 className="text-2xl font-semibold shepherd-dark-blue mb-2">Setting up your reminder...</h3>
            <p className="text-gray-600 text-lg">This will only take a moment</p>
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

            <h3 className="text-3xl font-semibold shepherd-dark-blue mb-2">Reminder Set Successfully!</h3>

            <p className="text-gray-600 text-xl mb-4">
              You can safely depart from here. Your Dream is safe. I will remind you to return at:
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-lg font-medium text-green-800">
                {formatReminderDateTime()}
              </p>
            </div>

            {/* Display temp token for now */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-lg text-gray-600 mb-1">Your access token (temporary):</p>
              <code className="text-sm font-mono text-gray-800 break-all">{tempToken}</code>
            </div>

            <p className="text-lg text-gray-500 mb-4">
              Save this token if you need to return before your reminder arrives.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-5 px-6 text-xl rounded-lg transition-colors"
            >
              Looking forward to it!
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

            <h3 className="text-3xl font-semibold shepherd-dark-blue mb-2">Something went wrong</h3>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <ul className="text-lg text-red-700 text-left">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleTryAgain}
                className="flex-1 shepherd-dark-blue-bg hover:shepherd-blue-bg text-white font-semibold py-4 px-6 text-xl rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-4 px-6 text-xl rounded-lg transition-colors"
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
