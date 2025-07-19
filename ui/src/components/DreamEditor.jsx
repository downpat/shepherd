import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  createDream,
  updateDream,
  validateDream
} from '../domain/Dream.js'
import dreamService from '../services/DreamService.js'

const DreamEditor = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [dream, setDream] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    vision: ''
  })
  const [errors, setErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  

  //Load dream by slug on component mount
  useEffect(() => {
    const loadDream = async () => {
      try {
        setLoading(true)
        const dreamData = await dreamService.getDreamBySlug(slug)
        if (dreamData) {
          setDream(dreamData)
          setFormData({
            title: dreamData.title || '',
            vision: dreamData.vision || ''
          })
        } else {
          // Dream not found, redirect to home
          navigate('/')
        }
      } catch (error) {
        console.error('Error loading dream:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadDream()
    }
  }, [slug, navigate])

  //Updates the form data state for the appropriate field
  //when a form input element is changed
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  //Handles form submission. Updates the existing dream
  //with form data and saves to service
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const dreamToSave = updateDream(dream, formData)
      const validation = validateDream(dreamToSave)
      
      if (!validation.isValid) {
        setErrors(validation.errors)
        setIsSubmitting(false)
        return
      }

      await dreamService.updateSingleDream(dream.id, formData)
      // Navigate to dreams dashboard after successful save
      navigate('/dreams')
    } catch (error) {
      setErrors(['Failed to save dream. Please try again.'])
      // On error, still go to dreams dashboard since user has dreams
      navigate('/dreams')
    } finally {
      setIsSubmitting(false)
    }
  }

  //Handles cancel - navigate to dreams dashboard since user has dreams
  const handleCancel = () => {
    navigate('/dreams')
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto p-8 text-center"
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold shepherd-dark-blue mb-8">Loading your dream...</h2>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto p-8"
    >
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold shepherd-dark-blue mb-8">
          Edit Your Dream
        </h2>

        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <ul className="list-disc list-inside text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title Field */}
          <div>
            <label 
              htmlFor="dream-title" 
              className="block text-lg font-semibold shepherd-dark-blue mb-3"
            >
              Dream Title
            </label>
            <input
              id="dream-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="What is your dream?"
              className="dream-title-input"
              maxLength={200}
            />
            <div className="text-sm text-gray-500 mt-2">
              {formData.title.length}/200 characters
            </div>
          </div>

          {/* Vision Field */}
          <div>
            <label 
              htmlFor="dream-vision" 
              className="block text-lg font-semibold shepherd-dark-blue mb-3"
            >
              Your Vision
            </label>
            <div className="text-sm text-gray-600 mb-3">
              {`Describe your dream in detail. What would your life ` +
               `look like? How would you feel? What would you be doing? ` +
               `Paint a vivid picture.`}
            </div>
            <textarea
              id="dream-vision"
              value={formData.vision}
              onChange={(e) => handleInputChange('vision', e.target.value)}
              placeholder="I envision a life where..."
              className="dream-vision-textarea"
              rows={12}
            />
            <div className="text-sm text-gray-500 mt-2">
              Supports Markdown formatting
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="shepherd-primary-button"
            >
              {isSubmitting 
                ? 'Saving...' 
                : isEditing 
                  ? 'Update Dream' 
                  : 'Save Dream'
              }
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default DreamEditor
