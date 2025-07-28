import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import DropCursor from '@tiptap/extension-dropcursor'
import GapCursor from '@tiptap/extension-gapcursor'
import {
  createDream,
  updateDream,
  validateDream
} from '../domain/Dream.js'
import dreamService from '../services/DreamService.js'
import { generateUUID } from '../utils/device.js'

const DreamEditor = ({ debugMode = false }) => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [dream, setDream] = useState(null)
  const [title, setTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [errors, setErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  console.log(`Debug mode: ${debugMode}`)

  // Tiptap editor for vision field
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'heading'
          }
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list'
          }
        },
        history: {
          depth: 100,
          newGroupDelay: 500
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image'
        }
      })
    ],
    content: '',
    autofocus: false,
    editorProps: {
      attributes: {
        class: 'font-serif text-lg text-slate-700 leading-relaxed focus:outline-none',
        'data-placeholder': 'I envision a life where...'
      },
    },
    onFocus: () => setIsEditorFocused(true)
  })


  //Load dream by slug on component mount
  useEffect(() => {
    console.log('Use effect running');
    const loadDream = async () => {
      try {
        setLoading(true)
        const dreamData = await dreamService.getDreamBySlug(slug)
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
      } catch (error) {
        if (debugMode) {
          // Debug mode: create a new dream from the slug
          const debugTitle = slug.replace(/-/g, ' ')
          const debugDream = createDream({
            id: generateUUID(),
            title: debugTitle
          })
          await dreamService.saveDream(debugDream)
          setDream(debugDream)
          setTitle(debugDream.title)
        } else {
          // Production: redirect to home
          navigate('/')
        }
      } finally {
        setLoading(false)
      }
    }

    if (slug && editor) {
      loadDream()
    }
  }, [slug, navigate, editor, debugMode])

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
        className="min-h-screen bg-white flex items-center justify-center px-4"
      >
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light shepherd-dark-blue">Loading your dream...</h2>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="min-h-screen bg-white"
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
          className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8"
        >
          <div className="max-w-6xl mx-auto">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light shepherd-dark-blue bg-transparent border-none outline-none focus:ring-0 placeholder-gray-300"
                placeholder="What is your dream?"
                maxLength={200}
                autoFocus
              />
            ) : (
              <motion.h1
                onClick={handleTitleClick}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light shepherd-dark-blue cursor-pointer group relative"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                {title || 'What is your dream?'}
                <motion.span
                  className="absolute -right-8 sm:-right-10 lg:-right-12 top-2 sm:top-3 lg:top-4 text-xl sm:text-2xl lg:text-3xl text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
          className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8"
        >
          <div className="max-w-6xl mx-auto">
            {/* Tiptap Editor with Chiseled Stone Well Effect */}
            <div className="
              relative
              bg-gradient-to-br
              from-slate-100
              via-slate-50
              to-slate-200
              rounded-tl-2xl
              sm:rounded-tl-3xl
              pt-1 sm:pt-2
              pl-1 sm:pl-2
              shadow-[
                inset_2px_2px_4px_rgba(71,85,105,0.08),
                inset_-2px_-2px_4px_rgba(255,255,255,0.6)
              ]
              sm:shadow-[
                inset_4px_4px_8px_rgba(71,85,105,0.08),
                inset_-4px_-4px_8px_rgba(255,255,255,0.6)
              ]
              min-h-[50vh]
              sm:min-h-[60vh]
            ">
              <div className="
                bg-white
                rounded-tl-xl
                sm:rounded-tl-2xl
                shadow-sm
                border-t
                border-t-slate-100/30
                border-l
                border-l-slate-100/15
                min-h-[calc(50vh-8px)]
                sm:min-h-[calc(60vh-16px)]
                relative
              ">
                {/* Traditional Top Toolbar - Fades in when editor is focused */}
                {editor && isEditorFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-2 sm:p-3 z-10 overflow-x-auto"
                  >
                    <div className="flex items-center gap-1 flex-nowrap sm:flex-wrap min-w-max sm:min-w-0">
                      {/* Headings */}
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          editor.isActive('heading', { level: 1 })
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          editor.isActive('heading', { level: 2 })
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          editor.isActive('heading', { level: 3 })
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        H3
                      </button>

                      <div className="w-px h-4 sm:h-6 bg-slate-300 mx-0.5 sm:mx-1"></div>

                      {/* Text Formatting */}
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                          editor.isActive('bold')
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm italic transition-colors whitespace-nowrap ${
                          editor.isActive('italic')
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm line-through transition-colors whitespace-nowrap ${
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
                        type="button"
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
                        type="button"
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
                        type="button"
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
                        type="button"
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
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ↶ Undo
                      </button>
                      <button
                        type="button"
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
                  className={`
                    px-4 sm:px-6 lg:px-8
                    pb-4 sm:pb-6 lg:pb-8
                    min-h-[calc(50vh-8px)] sm:min-h-[calc(60vh-16px)]
                    max-w-none
                    focus:outline-none
                    [&_.ProseMirror]:min-h-[calc(50vh-32px)] sm:[&_.ProseMirror]:min-h-[calc(60vh-64px)]
                    [&_.ProseMirror]:focus:outline-none
                    [&_.ProseMirror.ProseMirror-focused]:outline-none
                    ${isEditorFocused ? 'pt-16 sm:pt-20' : 'pt-4 sm:pt-6 lg:pt-8'}
                  `}
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
          className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 sm:px-8 py-2 sm:py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm sm:text-base order-2 sm:order-1"
            >
              ← Back to Dreams
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full sm:w-auto
                px-8 sm:px-12
                py-3 sm:py-4
                shepherd-dark-blue-bg
                hover:shepherd-blue-bg
                text-white
                rounded-lg
                font-semibold
                text-base sm:text-lg
                transition-all
                transform hover:scale-105
                disabled:opacity-50 disabled:transform-none
                order-1 sm:order-2
              "
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
