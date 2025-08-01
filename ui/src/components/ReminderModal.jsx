import React from 'react'

/**
 * ReminderModal - Placeholder component for dream reminder functionality
 * This is a simple placeholder to test the Shepherd modal system
 */
function ReminderModal(props) {
  const { onClose } = props || {}
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold shepherd-dark-blue mb-4">
        Set Dream Reminder
      </h2>
      
      <p className="text-gray-700 mb-6">
        This is a placeholder component for the dream reminder feature. 
        In the future, this will allow you to set up email reminders 
        to return to your dream at a specific time.
      </p>
      
      <button 
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors"
      >
        Placeholder Button (No Function)
      </button>
    </div>
  )
}

export default ReminderModal