/**
 * HabitInstanceService - Service layer for HabitInstance operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */

import { updateHabitInstance, validateHabitInstance } from '../domain/HabitInstance.js'

class HabitInstanceService {
  constructor() {
    this.habitInstances = new Map() // In-memory storage for now
    this.listeners = new Set() // Event listeners for state changes
  }

  // Create a new habit instance
  async saveHabitInstance(habitInstance) {
    try {
      const validation = validateHabitInstance(habitInstance)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid habit instance: ${errorList}`)
      }

      this.habitInstances.set(habitInstance.id, habitInstance)
      this.notifyListeners('habitInstanceSaved', habitInstance)
      
      return habitInstance
    } catch (error) {
      console.error('Failed to save habit instance:', error)
      throw error
    }
  }

  // Get a habit instance by ID
  async getHabitInstance(id) {
    try {
      const habitInstance = this.habitInstances.get(id)
      if (!habitInstance) {
        throw new Error(`Habit instance with id ${id} not found`)
      }
      return habitInstance
    } catch (error) {
      console.error('Failed to get habit instance:', error)
      throw error
    }
  }

  // Get all habit instances
  async getAllHabitInstances() {
    try {
      return Array.from(this.habitInstances.values())
        .sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get all habit instances:', error)
      throw error
    }
  }

  // Get habit instances by habit identity ID
  async getHabitInstancesByIdentityId(habitIdentityId) {
    try {
      return Array.from(this.habitInstances.values())
        .filter(instance => instance.habitIdentityId === habitIdentityId)
        .sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get habit instances by identity ID:', error)
      throw error
    }
  }

  // Get habit instances by task ID
  async getHabitInstancesByTaskId(taskId) {
    try {
      return Array.from(this.habitInstances.values())
        .filter(instance => instance.taskId === taskId)
        .sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
    } catch (error) {
      console.error('Failed to get habit instances by task ID:', error)
      throw error
    }
  }

  // Get habit instance by the unique pairing (habitIdentityId + taskId)
  async getHabitInstanceByPairing(habitIdentityId, taskId) {
    try {
      const instance = Array.from(this.habitInstances.values())
        .find(i => i.habitIdentityId === habitIdentityId && i.taskId === taskId)
      
      if (!instance) {
        throw new Error(`Habit instance with identity ${habitIdentityId} and task ${taskId} not found`)
      }
      
      return instance
    } catch (error) {
      console.error('Failed to get habit instance by pairing:', error)
      throw error
    }
  }

  // Check if a pairing already exists
  async pairingExists(habitIdentityId, taskId) {
    try {
      const instance = Array.from(this.habitInstances.values())
        .find(i => i.habitIdentityId === habitIdentityId && i.taskId === taskId)
      
      return !!instance
    } catch (error) {
      console.error('Failed to check if pairing exists:', error)
      return false
    }
  }

  // Update an existing habit instance
  async updateSingleHabitInstance(id, updates) {
    try {
      const existingHabitInstance = await this.getHabitInstance(id)
      const updatedHabitInstance = updateHabitInstance(existingHabitInstance, updates)
      
      const validation = validateHabitInstance(updatedHabitInstance)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid habit instance update: ${errorList}`)
      }

      this.habitInstances.set(id, updatedHabitInstance)
      this.notifyListeners('habitInstanceUpdated', updatedHabitInstance)
      
      return updatedHabitInstance
    } catch (error) {
      console.error('Failed to update habit instance:', error)
      throw error
    }
  }

  // Delete a habit instance
  async deleteHabitInstance(id) {
    try {
      const habitInstance = await this.getHabitInstance(id)
      this.habitInstances.delete(id)
      this.notifyListeners('habitInstanceDeleted', habitInstance)
      
      return habitInstance
    } catch (error) {
      console.error('Failed to delete habit instance:', error)
      throw error
    }
  }

  // Delete habit instances by habit identity ID (when identity is deleted)
  async deleteHabitInstancesByIdentityId(habitIdentityId) {
    try {
      const instancesToDelete = await this.getHabitInstancesByIdentityId(habitIdentityId)
      const deletedInstances = []
      
      for (const instance of instancesToDelete) {
        this.habitInstances.delete(instance.id)
        deletedInstances.push(instance)
      }
      
      if (deletedInstances.length > 0) {
        this.notifyListeners('habitInstancesBulkDeleted', { 
          deletedCount: deletedInstances.length,
          habitIdentityId,
          instances: deletedInstances
        })
      }
      
      return deletedInstances
    } catch (error) {
      console.error('Failed to delete habit instances by identity ID:', error)
      throw error
    }
  }

  // Delete habit instances by task ID (when task is deleted)
  async deleteHabitInstancesByTaskId(taskId) {
    try {
      const instancesToDelete = await this.getHabitInstancesByTaskId(taskId)
      const deletedInstances = []
      
      for (const instance of instancesToDelete) {
        this.habitInstances.delete(instance.id)
        deletedInstances.push(instance)
      }
      
      if (deletedInstances.length > 0) {
        this.notifyListeners('habitInstancesBulkDeleted', { 
          deletedCount: deletedInstances.length,
          taskId,
          instances: deletedInstances
        })
      }
      
      return deletedInstances
    } catch (error) {
      console.error('Failed to delete habit instances by task ID:', error)
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
        console.error('Error in habit instance service listener:', error)
      }
    })
  }

  // Utility methods
  async getHabitInstanceCount() {
    try {
      return this.habitInstances.size
    } catch (error) {
      console.error('Failed to get habit instance count:', error)
      throw error
    }
  }

  // Get habit instances with full context (joins identity and task data)
  async getHabitInstancesWithContext(habitIdentityService, taskService) {
    try {
      const instances = await this.getAllHabitInstances()
      const instancesWithContext = []
      
      for (const instance of instances) {
        try {
          const [habitIdentity, task] = await Promise.all([
            habitIdentityService.getHabitIdentity(instance.habitIdentityId),
            taskService.getTask(instance.taskId)
          ])
          
          instancesWithContext.push({
            ...instance,
            habitIdentity,
            task
          })
        } catch (error) {
          // Skip instances with missing references
          console.warn(`Skipping habit instance ${instance.id} due to missing references:`, error.message)
        }
      }
      
      return instancesWithContext
    } catch (error) {
      console.error('Failed to get habit instances with context:', error)
      throw error
    }
  }

  // Get statistics about habit instances
  async getHabitInstanceStatistics() {
    try {
      const instances = await this.getAllHabitInstances()
      const identityIds = new Set(instances.map(i => i.habitIdentityId))
      const taskIds = new Set(instances.map(i => i.taskId))
      
      return {
        totalInstances: instances.length,
        uniqueIdentities: identityIds.size,
        uniqueTasks: taskIds.size,
        averageTasksPerIdentity: instances.length / identityIds.size || 0,
        averageIdentitiesPerTask: instances.length / taskIds.size || 0
      }
    } catch (error) {
      console.error('Failed to get habit instance statistics:', error)
      throw error
    }
  }

  // Future: This will be replaced with actual persistence layer
  async exportData() {
    try {
      const habitInstances = await this.getAllHabitInstances()
      return {
        habitInstances,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Failed to export habit instance data:', error)
      throw error
    }
  }

  async importData(data) {
    try {
      if (!data.habitInstances || !Array.isArray(data.habitInstances)) {
        throw new Error('Invalid import data format')
      }

      this.habitInstances.clear()
      
      for (const habitInstance of data.habitInstances) {
        const validation = validateHabitInstance(habitInstance)
        if (validation.isValid) {
          this.habitInstances.set(habitInstance.id, habitInstance)
        } else {
          const errorList = validation.errors.join(', ')
          console.warn(`Skipping invalid habit instance during import: ${errorList}`)
        }
      }

      this.notifyListeners('dataImported', data)
      return this.habitInstances.size
    } catch (error) {
      console.error('Failed to import habit instance data:', error)
      throw error
    }
  }
}

// Singleton instance
const habitInstanceService = new HabitInstanceService()

export default habitInstanceService