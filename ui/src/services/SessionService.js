/**
 * SessionService - Service layer for Session operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */

import { updateSession, validateSession } from '../domain/Session.js'

class SessionService {
  constructor() {
    this.sessions = new Map() // In-memory storage for now
    this.listeners = new Set() // Event listeners for state changes
  }

  // Create a new session
  async saveSession(session) {
    try {
      const validation = validateSession(session)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid session: ${errorList}`)
      }

      this.sessions.set(session.id, session)
      this.notifyListeners('sessionSaved', session)
      
      return session
    } catch (error) {
      console.error('Failed to save session:', error)
      throw error
    }
  }

  // Get a session by ID
  async getSession(id) {
    try {
      const session = this.sessions.get(id)
      if (!session) {
        throw new Error(`Session with id ${id} not found`)
      }
      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      throw error
    }
  }

  // Get a session by slug
  async getSessionBySlug(slug) {
    try {
      const session = Array.from(this.sessions.values()).find(s => s.slug === slug)
      if (!session) {
        throw new Error(`Session with slug ${slug} not found`)
      }
      return session
    } catch (error) {
      console.error('Failed to get session by slug:', error)
      throw error
    }
  }

  // Get all sessions
  async getAllSessions() {
    try {
      return Array.from(this.sessions.values())
        .sort((a, b) => {
          // Sort by scheduled date/time, then by creation date
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get all sessions:', error)
      throw error
    }
  }

  // Get sessions by plan ID
  async getSessionsByPlanId(planId) {
    try {
      return Array.from(this.sessions.values())
        .filter(session => session.planId === planId)
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get sessions by plan ID:', error)
      throw error
    }
  }

  // Get sessions by status
  async getSessionsByStatus(status) {
    try {
      return Array.from(this.sessions.values())
        .filter(session => session.status === status)
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get sessions by status:', error)
      throw error
    }
  }

  // Get sessions by date
  async getSessionsByDate(date) {
    try {
      return Array.from(this.sessions.values())
        .filter(session => session.scheduledDate === date)
        .sort((a, b) => {
          const timeA = a.scheduledTime || '00:00'
          const timeB = b.scheduledTime || '00:00'
          
          if (timeA !== timeB) {
            return timeA.localeCompare(timeB)
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get sessions by date:', error)
      throw error
    }
  }

  // Get sessions by date range
  async getSessionsByDateRange(startDate, endDate) {
    try {
      return Array.from(this.sessions.values())
        .filter(session => {
          return session.scheduledDate >= startDate && session.scheduledDate <= endDate
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get sessions by date range:', error)
      throw error
    }
  }

  // Update an existing session
  async updateSingleSession(id, updates) {
    try {
      const existingSession = await this.getSession(id)
      const updatedSession = updateSession(existingSession, updates)
      
      const validation = validateSession(updatedSession)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid session update: ${errorList}`)
      }

      this.sessions.set(id, updatedSession)
      this.notifyListeners('sessionUpdated', updatedSession)
      
      return updatedSession
    } catch (error) {
      console.error('Failed to update session:', error)
      throw error
    }
  }

  // Mark session as completed with reflection
  async completeSession(id, sessionNotes = '', sessionMood = '') {
    try {
      const updates = {
        status: 'completed',
        sessionNotes,
        sessionMood
      }
      
      return await this.updateSingleSession(id, updates)
    } catch (error) {
      console.error('Failed to complete session:', error)
      throw error
    }
  }

  // Mark session as skipped
  async skipSession(id) {
    try {
      return await this.updateSingleSession(id, { status: 'skipped' })
    } catch (error) {
      console.error('Failed to skip session:', error)
      throw error
    }
  }

  // Start a session (for real-time UI tracking)
  async startSession(id) {
    try {
      return await this.updateSingleSession(id, { 
        status: 'in_progress',
        startedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to start session:', error)
      throw error
    }
  }

  // Clone a session for easy repetition
  async cloneSession(id, newScheduledDate, newScheduledTime = null) {
    try {
      const originalSession = await this.getSession(id)
      
      const clonedSession = {
        ...originalSession,
        id: crypto.randomUUID(),
        scheduledDate: newScheduledDate,
        scheduledTime: newScheduledTime || originalSession.scheduledTime,
        status: 'scheduled',
        sessionNotes: '', // Clear reflection fields
        sessionMood: '',
        startedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Regenerate slug with new ID
      const slugTitle = clonedSession.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30)
      clonedSession.slug = `session-${slugTitle}-${clonedSession.id.split('-')[0]}`

      return await this.saveSession(clonedSession)
    } catch (error) {
      console.error('Failed to clone session:', error)
      throw error
    }
  }

  // Delete a session
  async deleteSession(id) {
    try {
      const session = await this.getSession(id)
      this.sessions.delete(id)
      this.notifyListeners('sessionDeleted', session)
      
      return session
    } catch (error) {
      console.error('Failed to delete session:', error)
      throw error
    }
  }

  // Event system for UI reactivity
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Error in session service listener:', error)
      }
    })
  }

  // Utility methods
  async searchSessions(query) {
    try {
      const sessions = await this.getAllSessions()
      const lowerQuery = query.toLowerCase()
      
      return sessions.filter(session => 
        session.title.toLowerCase().includes(lowerQuery) ||
        session.missionConnection.toLowerCase().includes(lowerQuery) ||
        (session.sessionNotes && session.sessionNotes.toLowerCase().includes(lowerQuery))
      )
    } catch (error) {
      console.error('Failed to search sessions:', error)
      throw error
    }
  }

  async getSessionCount() {
    try {
      return this.sessions.size
    } catch (error) {
      console.error('Failed to get session count:', error)
      throw error
    }
  }

  // Get sessions for today
  async getTodaysSessions() {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      return await this.getSessionsByDate(today)
    } catch (error) {
      console.error('Failed to get today\'s sessions:', error)
      throw error
    }
  }

  // Get completed sessions with reflection data
  async getCompletedSessionsWithReflection() {
    try {
      const completedSessions = await this.getSessionsByStatus('completed')
      return completedSessions.filter(session => 
        session.sessionNotes || session.sessionMood
      )
    } catch (error) {
      console.error('Failed to get sessions with reflection:', error)
      throw error
    }
  }

  // Get sessions that meet prerequisites
  async getSessionsWithPrerequisites(availablePrerequisites) {
    try {
      const scheduledSessions = await this.getSessionsByStatus('scheduled')
      return scheduledSessions.filter(session => {
        return session.prerequisites.every(prereq => 
          availablePrerequisites.includes(prereq)
        )
      })
    } catch (error) {
      console.error('Failed to get sessions with prerequisites:', error)
      throw error
    }
  }

  // Future: This will be replaced with actual persistence layer
  async exportData() {
    try {
      const sessions = await this.getAllSessions()
      return {
        sessions,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Failed to export session data:', error)
      throw error
    }
  }

  async importData(data) {
    try {
      if (!data.sessions || !Array.isArray(data.sessions)) {
        throw new Error('Invalid import data format')
      }

      this.sessions.clear()
      
      for (const session of data.sessions) {
        const validation = validateSession(session)
        if (validation.isValid) {
          this.sessions.set(session.id, session)
        } else {
          const errorList = validation.errors.join(', ')
          console.warn(`Skipping invalid session during import: ${errorList}`)
        }
      }

      this.notifyListeners('dataImported', data)
      return this.sessions.size
    } catch (error) {
      console.error('Failed to import session data:', error)
      throw error
    }
  }
}

// Singleton instance
const sessionService = new SessionService()

export default sessionService