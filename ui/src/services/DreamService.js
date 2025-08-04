/**
 * DreamService - Service layer for Dream operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */
import config from '../../conf/svc.config.js'

import { createDream, updateDream, validateDream } from '../domain/Dream.js'
import { generateUUID } from '../utils/device.js'

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

  /**
   * Initialize DreamService based on the authenticated dreamer type
   * @param {Object} dreamer - The authenticated dreamer object
   */
  async initForDreamer(dreamer) {
    try {
      // Clear any existing state
      this.dreams.clear()
      this.currentDream = null

      if (!dreamer) {
        console.log('DreamService: No dreamer provided, initializing as anonymous')
        this.isInitialized = true
        return
      }

      switch (dreamer.type) {
        case 'anonymous':
          console.log('DreamService: Initializing for anonymous dreamer - empty state')
          // Keep dreams and currentDream empty for anonymous users
          break

        case 'intro':
          console.log('DreamService: Initializing for intro dreamer with saved dream data')
          await this.initForIntroDreamer(dreamer)
          break

        case 'normal':
          console.log('DreamService: Normal dreamer initialization - TODO: implement API fetch')
          // TODO: Implement normal dreamer flow
          // This will fetch dreams from API for authenticated normal dreamers
          break

        default:
          console.warn('DreamService: Unknown dreamer type:', dreamer.type)
          break
      }

      this.isInitialized = true
      this.notifyListeners('dreamServiceInitialized', { dreamer, dreamCount: this.dreams.size })

    } catch (error) {
      console.error('DreamService.initForDreamer failed:', error)
      // Initialize with empty state on error
      this.dreams.clear()
      this.currentDream = null
      this.isInitialized = true
    }
  }

  /**
   * Initialize DreamService for IntroDreamer with their saved dream
   * @param {Object} introDreamer - The intro dreamer with dream data
   */
  async initForIntroDreamer(introDreamer) {
    try {
      // Extract dream data from introDreamer (adjust field names based on API response)
      const dreamTitle = introDreamer.dreamTitle || introDreamer.title || 'My Dream'
      const dreamVision = introDreamer.dreamVision || introDreamer.vision || ''

      // Create dream object using domain layer with generated ID
      const dreamId = generateUUID()
      const dreamData = {
        id: dreamId,
        title: dreamTitle,
        vision: dreamVision
      }

      const dream = createDream(dreamData)

      // Validate the dream
      const validation = validateDream(dream)
      if (!validation.isValid) {
        console.error('Invalid dream created for IntroDreamer:', validation.errors)
        throw new Error(`Invalid dream: ${validation.errors.join(', ')}`)
      }

      // Add dream to service storage
      this.dreams.set(dream.id, dream)
      this.currentDream = dream

      console.log('DreamService: Successfully initialized IntroDreamer dream:', {
        id: dream.id,
        title: dream.title,
        slug: dream.slug
      })

      // Notify listeners
      this.notifyListeners('dreamSaved', dream)
      this.notifyListeners('currentDreamChanged', dream)

    } catch (error) {
      console.error('DreamService.initForIntroDreamer failed:', error)
      throw error
    }
  }

  async fetchDreams() {
    const resp = await fetch(`${config.host}/api/dreams`)

    if(resp.data) {
      resp.data.forEach( (dream, idx) => {
        const d = createDream(dream)

        if(idx === 0) this.currentDream = d

        this.dreams.set(dream.id, d)
      })
    }
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

  // Current dream management
  setCurrentDream(dream) {
    this.currentDream = dream
    this.notifyListeners('currentDreamChanged', dream)
  }

  getCurrentDream() {
    return this.currentDream
  }

  // Update current dream's title in memory
  updateCurrentDreamTitle(newTitle) {
    if (!this.currentDream) {
      console.warn('DreamService.updateCurrentDreamTitle: No current dream set')
      return false
    }

    try {
      const updatedDream = updateDream(this.currentDream, { title: newTitle })
      const validation = validateDream(updatedDream)
      
      if (validation.isValid) {
        this.currentDream = updatedDream
        // Update in memory storage
        this.dreams.set(this.currentDream.id, this.currentDream)
        this.notifyListeners('dreamUpdated', this.currentDream)
        this.notifyListeners('currentDreamChanged', this.currentDream)
        return true
      } else {
        console.warn('DreamService.updateCurrentDreamTitle: Invalid title update', validation.errors)
        return false
      }
    } catch (error) {
      console.error('DreamService.updateCurrentDreamTitle: Error updating title', error)
      return false
    }
  }

  // Update current dream's vision in memory
  updateCurrentDreamVision(newVision) {
    if (!this.currentDream) {
      console.warn('DreamService.updateCurrentDreamVision: No current dream set')
      return false
    }

    try {
      const updatedDream = updateDream(this.currentDream, { vision: newVision })
      const validation = validateDream(updatedDream)
      
      if (validation.isValid) {
        this.currentDream = updatedDream
        // Update in memory storage
        this.dreams.set(this.currentDream.id, this.currentDream)
        this.notifyListeners('dreamUpdated', this.currentDream)
        this.notifyListeners('currentDreamChanged', this.currentDream)
        return true
      } else {
        console.warn('DreamService.updateCurrentDreamVision: Invalid vision update', validation.errors)
        return false
      }
    } catch (error) {
      console.error('DreamService.updateCurrentDreamVision: Error updating vision', error)
      return false
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
