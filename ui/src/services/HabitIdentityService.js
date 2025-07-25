/**
 * HabitIdentityService - Service layer for HabitIdentity operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */

import { updateHabitIdentity, validateHabitIdentity } from '../domain/HabitIdentity.js'

class HabitIdentityService {
  constructor() {
    this.habitIdentities = new Map() // In-memory storage for now
    this.listeners = new Set() // Event listeners for state changes
  }

  // Create a new habit identity
  async saveHabitIdentity(habitIdentity) {
    try {
      const validation = validateHabitIdentity(habitIdentity)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid habit identity: ${errorList}`)
      }

      this.habitIdentities.set(habitIdentity.id, habitIdentity)
      this.notifyListeners('habitIdentitySaved', habitIdentity)
      
      return habitIdentity
    } catch (error) {
      console.error('Failed to save habit identity:', error)
      throw error
    }
  }

  // Get a habit identity by ID
  async getHabitIdentity(id) {
    try {
      const habitIdentity = this.habitIdentities.get(id)
      if (!habitIdentity) {
        throw new Error(`Habit identity with id ${id} not found`)
      }
      return habitIdentity
    } catch (error) {
      console.error('Failed to get habit identity:', error)
      throw error
    }
  }

  // Get a habit identity by slug
  async getHabitIdentityBySlug(slug) {
    try {
      const habitIdentity = Array.from(this.habitIdentities.values()).find(h => h.slug === slug)
      if (!habitIdentity) {
        throw new Error(`Habit identity with slug ${slug} not found`)
      }
      return habitIdentity
    } catch (error) {
      console.error('Failed to get habit identity by slug:', error)
      throw error
    }
  }

  // Get all habit identities
  async getAllHabitIdentities() {
    try {
      return Array.from(this.habitIdentities.values())
        .sort((a, b) => {
          // Sort by status (active first), then by earned date
          if (a.status !== b.status) {
            const statusOrder = { active: 0, paused: 1, retired: 2 }
            return statusOrder[a.status] - statusOrder[b.status]
          }
          
          return new Date(b.earnedAt) - new Date(a.earnedAt)
        })
    } catch (error) {
      console.error('Failed to get all habit identities:', error)
      throw error
    }
  }

  // Get habit identities by status
  async getHabitIdentitiesByStatus(status) {
    try {
      return Array.from(this.habitIdentities.values())
        .filter(habitIdentity => habitIdentity.status === status)
        .sort((a, b) => {
          return new Date(b.earnedAt) - new Date(a.earnedAt)
        })
    } catch (error) {
      console.error('Failed to get habit identities by status:', error)
      throw error
    }
  }

  // Get habit identities by source type
  async getHabitIdentitiesBySourceType(sourceType) {
    try {
      return Array.from(this.habitIdentities.values())
        .filter(habitIdentity => habitIdentity.sourceType === sourceType)
        .sort((a, b) => {
          return new Date(b.earnedAt) - new Date(a.earnedAt)
        })
    } catch (error) {
      console.error('Failed to get habit identities by source type:', error)
      throw error
    }
  }

  // Get habit identities by plan ID
  async getHabitIdentitiesByPlanId(planId) {
    try {
      return Array.from(this.habitIdentities.values())
        .filter(habitIdentity => habitIdentity.planId === planId)
        .sort((a, b) => {
          return new Date(b.earnedAt) - new Date(a.earnedAt)
        })
    } catch (error) {
      console.error('Failed to get habit identities by plan ID:', error)
      throw error
    }
  }

  // Update an existing habit identity
  async updateSingleHabitIdentity(id, updates) {
    try {
      const existingHabitIdentity = await this.getHabitIdentity(id)
      const updatedHabitIdentity = updateHabitIdentity(existingHabitIdentity, updates)
      
      const validation = validateHabitIdentity(updatedHabitIdentity)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid habit identity update: ${errorList}`)
      }

      this.habitIdentities.set(id, updatedHabitIdentity)
      this.notifyListeners('habitIdentityUpdated', updatedHabitIdentity)
      
      return updatedHabitIdentity
    } catch (error) {
      console.error('Failed to update habit identity:', error)
      throw error
    }
  }

  // Pause a habit identity
  async pauseHabitIdentity(id, reason = '') {
    try {
      const updates = {
        status: 'paused',
        pausedAt: new Date().toISOString(),
        pauseReason: reason
      }
      
      return await this.updateSingleHabitIdentity(id, updates)
    } catch (error) {
      console.error('Failed to pause habit identity:', error)
      throw error
    }
  }

  // Resume a habit identity
  async resumeHabitIdentity(id) {
    try {
      const updates = {
        status: 'active',
        pausedAt: null,
        pauseReason: ''
      }
      
      return await this.updateSingleHabitIdentity(id, updates)
    } catch (error) {
      console.error('Failed to resume habit identity:', error)
      throw error
    }
  }

  // Retire a habit identity
  async retireHabitIdentity(id, reason = '') {
    try {
      const updates = {
        status: 'retired',
        retiredAt: new Date().toISOString(),
        retireReason: reason
      }
      
      return await this.updateSingleHabitIdentity(id, updates)
    } catch (error) {
      console.error('Failed to retire habit identity:', error)
      throw error
    }
  }

  // Delete a habit identity
  async deleteHabitIdentity(id) {
    try {
      const habitIdentity = await this.getHabitIdentity(id)
      this.habitIdentities.delete(id)
      this.notifyListeners('habitIdentityDeleted', habitIdentity)
      
      return habitIdentity
    } catch (error) {
      console.error('Failed to delete habit identity:', error)
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
        console.error('Error in habit identity service listener:', error)
      }
    })
  }

  // Utility methods
  async searchHabitIdentities(query) {
    try {
      const habitIdentities = await this.getAllHabitIdentities()
      const lowerQuery = query.toLowerCase()
      
      return habitIdentities.filter(habitIdentity => 
        habitIdentity.name.toLowerCase().includes(lowerQuery) ||
        habitIdentity.sourceTitle.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Failed to search habit identities:', error)
      throw error
    }
  }

  async getHabitIdentityCount() {
    try {
      return this.habitIdentities.size
    } catch (error) {
      console.error('Failed to get habit identity count:', error)
      throw error
    }
  }

  // Get active habits (for badge display)
  async getActiveHabits() {
    try {
      return await this.getHabitIdentitiesByStatus('active')
    } catch (error) {
      console.error('Failed to get active habits:', error)
      throw error
    }
  }

  // Get recently earned habits
  async getRecentlyEarnedHabits(daysBack = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      const allHabits = await this.getAllHabitIdentities()
      return allHabits.filter(habit => {
        const earnedDate = new Date(habit.earnedAt)
        return earnedDate >= cutoffDate
      }).sort((a, b) => {
        return new Date(b.earnedAt) - new Date(a.earnedAt)
      })
    } catch (error) {
      console.error('Failed to get recently earned habits:', error)
      throw error
    }
  }

  // Get habit identity statistics
  async getHabitIdentityStatistics() {
    try {
      const allHabits = await this.getAllHabitIdentities()
      const activeCount = allHabits.filter(h => h.status === 'active').length
      const pausedCount = allHabits.filter(h => h.status === 'paused').length
      const retiredCount = allHabits.filter(h => h.status === 'retired').length
      const taskBasedCount = allHabits.filter(h => h.sourceType === 'task').length
      const sessionBasedCount = allHabits.filter(h => h.sourceType === 'session').length
      
      return {
        total: allHabits.length,
        active: activeCount,
        paused: pausedCount,
        retired: retiredCount,
        taskBased: taskBasedCount,
        sessionBased: sessionBasedCount
      }
    } catch (error) {
      console.error('Failed to get habit identity statistics:', error)
      throw error
    }
  }

  // Future: This will be replaced with actual persistence layer
  async exportData() {
    try {
      const habitIdentities = await this.getAllHabitIdentities()
      return {
        habitIdentities,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Failed to export habit identity data:', error)
      throw error
    }
  }

  async importData(data) {
    try {
      if (!data.habitIdentities || !Array.isArray(data.habitIdentities)) {
        throw new Error('Invalid import data format')
      }

      this.habitIdentities.clear()
      
      for (const habitIdentity of data.habitIdentities) {
        const validation = validateHabitIdentity(habitIdentity)
        if (validation.isValid) {
          this.habitIdentities.set(habitIdentity.id, habitIdentity)
        } else {
          const errorList = validation.errors.join(', ')
          console.warn(`Skipping invalid habit identity during import: ${errorList}`)
        }
      }

      this.notifyListeners('dataImported', data)
      return this.habitIdentities.size
    } catch (error) {
      console.error('Failed to import habit identity data:', error)
      throw error
    }
  }
}

// Singleton instance
const habitIdentityService = new HabitIdentityService()

export default habitIdentityService