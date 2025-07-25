import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
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
  const [title, setTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [errors, setErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  // Tiptap editor for vision field
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image
    ],
    content: '',
    autofocus: false,
    editorProps: {
      attributes: {
        class: 'font-serif text-lg text-slate-700 leading-relaxed focus:outline-none',
        'data-placeholder': 'I envision a life where...'
      },
    },
    onFocus: () => setIsEditorFocused(true),
    onBlur: () => setIsEditorFocused(false),
  })


  //Load dream by slug on component mount
  useEffect(() => {
    const loadDream = async () => {
      try {
        setLoading(true)
        const dreamData = await dreamService.getDreamBySlug(slug)
        if (dreamData) {
          setDream(dreamData)
          setTitle(dreamData.title || '')
          
          // Set editor content - handle both JSON and string vision data
          if (editor && dreamData.vision) {
            try {
              // Try to parse as JSON first (Tiptap format)
              const visionData = typeof dreamData.vision === 'string' 
                ? JSON.parse(dreamData.vision) 
                : dreamData.vision
              editor.commands.setContent(visionData)
            } catch {
              // If not JSON, treat as plain text/HTML
              editor.commands.setContent(dreamData.vision)
            }
          }
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

    if (slug && editor) {
      loadDream()
    }
  }, [slug, navigate, editor])

  // Handle title editing
  const handleTitleClick = () => {
    setIsEditingTitle(true)
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }

  //Handles form submission. Updates the existing dream
  //with vision from Tiptap editor and title
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const visionData = editor ? JSON.stringify(editor.getJSON()) : ''
      const formData = {
        title,
        vision: visionData
      }

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
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center"
      >
        <div className="text-center">
          <h2 className="text-5xl font-light shepherd-dark-blue">Loading your dream...</h2>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      {/* Error Display */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg"
        >
          <ul className="list-disc list-inside text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="min-h-screen flex flex-col">
        {/* Dream Title - Large, Editable Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="px-8 pt-12 pb-8"
        >
          <div className="max-w-6xl mx-auto">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-6xl font-light shepherd-dark-blue bg-transparent border-none outline-none focus:ring-0 placeholder-gray-300"
                placeholder="What is your dream?"
                maxLength={200}
                autoFocus
              />
            ) : (
              <motion.h1
                onClick={handleTitleClick}
                className="text-6xl font-light shepherd-dark-blue cursor-pointer group relative"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                {title || 'What is your dream?'}
                <motion.span
                  className="absolute -right-12 top-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  ✏️
                </motion.span>
              </motion.h1>
            )}
          </div>
        </motion.div>

        {/* Vision Editor - Chiseled Stone Well */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex-1 px-8 pb-8"
        >
          <div className="max-w-6xl mx-auto">            
            {/* Tiptap Editor with Chiseled Stone Well Effect */}
            <div className="relative bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 rounded-3xl p-2 shadow-[inset_8px_8px_16px_rgba(71,85,105,0.1),inset_-8px_-8px_16px_rgba(255,255,255,0.8)] min-h-[60vh]">
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-100/50 min-h-[calc(60vh-16px)] relative">
                
                {/* Traditional Top Toolbar - Fades in when editor is focused */}
                {editor && isEditorFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-3 z-10"
                  >
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Headings */}
                      <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          editor.isActive('heading', { level: 1 }) 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        H1
                      </button>
                      <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          editor.isActive('heading', { level: 2 }) 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        H2
                      </button>
                      <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          editor.isActive('heading', { level: 3 }) 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        H3
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      
                      {/* Text Formatting */}
                      <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                          editor.isActive('bold') 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-3 py-1.5 rounded text-sm italic transition-colors ${
                          editor.isActive('italic') 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        I
                      </button>
                      <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`px-3 py-1.5 rounded text-sm line-through transition-colors ${
                          editor.isActive('strike') 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        S
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      
                      {/* Lists */}
                      <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          editor.isActive('bulletList') 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        • List
                      </button>
                      <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          editor.isActive('orderedList') 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        1. List
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      
                      {/* Block Formatting */}
                      <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          editor.isActive('blockquote') 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        Quote
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      
                      {/* Image */}
                      <button
                        onClick={() => {
                          const url = prompt('Enter image URL:')
                          if (url) {
                            editor.chain().focus().setImage({ src: url }).run()
                          }
                        }}
                        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        📷 Image
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      
                      {/* Undo/Redo */}
                      <button
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ↶ Undo
                      </button>
                      <button
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ↷ Redo
                      </button>
                    </div>
                  </motion.div>
                )}

                <EditorContent 
                  editor={editor}
                  className={`px-8 pb-8 min-h-[calc(60vh-16px)] prose prose-lg prose-slate max-w-none focus:outline-none [&_.ProseMirror]:min-h-[calc(60vh-64px)] [&_.ProseMirror]:focus:outline-none [&_.ProseMirror.ProseMirror-focused]:outline-none ${
                    isEditorFocused ? 'pt-20' : 'pt-8'
                  }`}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons - Floating Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
          className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-8 py-6"
        >
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              ← Back to Dreams
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {isSubmitting ? 'Preserving your vision...' : 'Save Dream'}
            </button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  )
}

export default DreamEditor
