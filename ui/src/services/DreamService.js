/**
 * DreamService - Service layer for Dream operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */

import { createDream, updateDream, validateDream } from '../domain/Dream.js'

class DreamService {
  constructor() {
    this.currentDream = null
    this.dreams = new Map() // In-memory storage for now
    this.isInitialized = false
    this.listeners = new Set() // Event listeners for state changes
  }

  async init() {
    if (!this.isInitialized) {
      await this.fetchDreams()
      this.isInitialized = true
    }
  }

  async fetchDreams() {
    const resp = await fetch('/api/dreams')

    resp.data.forEach( (dream, idx) => {
      const d = createDream(dream)

      if(idx === 0) this.currentDream = d

      this.dreams.set(dream.id, d)
    })
  }

  // Create a new dream
  async saveDream(dream) {
    try {
      const validation = validateDream(dream)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid dream: ${errorList}`)
      }

      this.dreams.set(dream.id, dream)
      this.notifyListeners('dreamSaved', dream)

      return dream
    } catch (error) {
      console.error('Failed to save dream:', error)
      throw error
    }
  }

  // Get a dream by ID
  async getDream(id) {
    try {
      const dream = this.dreams.get(id)
      if (!dream) {
        throw new Error(`Dream with id ${id} not found`)
      }
      return dream
    } catch (error) {
      console.error('Failed to get dream:', error)
      throw error
    }
  }

  // Get a dream by slug
  async getDreamBySlug(slug) {
    try {
      const dream = Array.from(this.dreams.values()).find(d => d.slug === slug)
      if (!dream) {
        throw new Error(`Dream with slug ${slug} not found`)
      }
      return dream
    } catch (error) {
      console.error('Failed to get dream by slug:', error)
      throw error
    }
  }

  // Get all dreams
  async getAllDreams() {
    try {
      return Array.from(this.dreams.values())
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get all dreams:', error)
      throw error
    }
  }

  // Update an existing dream
  async updateSingleDream(id, updates) {
    try {
      const existingDream = await this.getDream(id)
      const updatedDream = updateDream(existingDream, updates);

      const validation = validateDream(updatedDream)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid dream update: ${errorList}`)
      }

      this.dreams.set(id, updatedDream)
      this.notifyListeners('dreamUpdated', updatedDream)

      return updatedDream
    } catch (error) {
      console.error('Failed to update dream:', error)
      throw error
    }
  }

  // Delete a dream
  async deleteDream(id) {
    try {
      const dream = await this.getDream(id)
      this.dreams.delete(id)
      this.notifyListeners('dreamDeleted', dream)

      return dream
    } catch (error) {
      console.error('Failed to delete dream:', error)
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
        console.error('Error in dream service listener:', error)
      }
    })
  }

  // Utility methods
  async searchDreams(query) {
    try {
      const dreams = await this.getAllDreams()
      const lowerQuery = query.toLowerCase()

      return dreams.filter(dream =>
        dream.title.toLowerCase().includes(lowerQuery) ||
        dream.vision.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Failed to search dreams:', error)
      throw error
    }
  }

  async getDreamCount() {
    try {
      return this.dreams.size
    } catch (error) {
      console.error('Failed to get dream count:', error)
      throw error
    }
  }

  // Future: This will be replaced with actual persistence layer
  async exportData() {
    try {
      const dreams = await this.getAllDreams()
      return {
        dreams,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }

  async importData(data) {
    try {
      if (!data.dreams || !Array.isArray(data.dreams)) {
        throw new Error('Invalid import data format')
      }

      this.dreams.clear()

      for (const dream of data.dreams) {
        const validation = validateDream(dream)
        if (validation.isValid) {
          this.dreams.set(dream.id, dream)
        } else {
          const errorList = validation.errors.join(', ')
          console.warn(`Skipping invalid dream during import: ${errorList}`)
        }
      }

      this.notifyListeners('dataImported', data)
      return this.dreams.size
    } catch (error) {
      console.error('Failed to import data:', error)
      throw error
    }
  }
}

// Singleton instance
const dreamService = new DreamService()

export default dreamService
