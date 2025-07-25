/**
 * TaskService - Service layer for Task operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */

import { updateTask, validateTask } from '../domain/Task.js'

class TaskService {
  constructor() {
    this.tasks = new Map() // In-memory storage for now
    this.listeners = new Set() // Event listeners for state changes
    this.nextIntegerId = 1 // Simple integer ID counter for tasks
  }

  // Create a new task
  async saveTask(task) {
    try {
      // Assign integer ID if not provided
      if (!task.id) {
        task.id = this.nextIntegerId++
      }

      const validation = validateTask(task)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid task: ${errorList}`)
      }

      this.tasks.set(task.id, task)
      this.notifyListeners('taskSaved', task)
      
      return task
    } catch (error) {
      console.error('Failed to save task:', error)
      throw error
    }
  }

  // Get a task by ID
  async getTask(id) {
    try {
      const task = this.tasks.get(id)
      if (!task) {
        throw new Error(`Task with id ${id} not found`)
      }
      return task
    } catch (error) {
      console.error('Failed to get task:', error)
      throw error
    }
  }

  // Get a task by slug
  async getTaskBySlug(slug) {
    try {
      const task = Array.from(this.tasks.values()).find(t => t.slug === slug)
      if (!task) {
        throw new Error(`Task with slug ${slug} not found`)
      }
      return task
    } catch (error) {
      console.error('Failed to get task by slug:', error)
      throw error
    }
  }

  // Get all tasks
  async getAllTasks() {
    try {
      return Array.from(this.tasks.values())
        .sort((a, b) => {
          // Sort by scheduled date/time, then by ID
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return a.id - b.id
        })
    } catch (error) {
      console.error('Failed to get all tasks:', error)
      throw error
    }
  }

  // Get tasks by plan ID
  async getTasksByPlanId(planId) {
    try {
      return Array.from(this.tasks.values())
        .filter(task => task.planId === planId)
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return a.id - b.id
        })
    } catch (error) {
      console.error('Failed to get tasks by plan ID:', error)
      throw error
    }
  }

  // Get tasks by status
  async getTasksByStatus(status) {
    try {
      return Array.from(this.tasks.values())
        .filter(task => task.status === status)
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return a.id - b.id
        })
    } catch (error) {
      console.error('Failed to get tasks by status:', error)
      throw error
    }
  }

  // Get tasks by date
  async getTasksByDate(date) {
    try {
      return Array.from(this.tasks.values())
        .filter(task => task.scheduledDate === date)
        .sort((a, b) => {
          const timeA = a.scheduledTime || '00:00'
          const timeB = b.scheduledTime || '00:00'
          
          if (timeA !== timeB) {
            return timeA.localeCompare(timeB)
          }
          
          return a.id - b.id
        })
    } catch (error) {
      console.error('Failed to get tasks by date:', error)
      throw error
    }
  }

  // Get tasks by date range
  async getTasksByDateRange(startDate, endDate) {
    try {
      return Array.from(this.tasks.values())
        .filter(task => {
          return task.scheduledDate >= startDate && task.scheduledDate <= endDate
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB
          }
          
          return a.id - b.id
        })
    } catch (error) {
      console.error('Failed to get tasks by date range:', error)
      throw error
    }
  }

  // Update an existing task
  async updateSingleTask(id, updates) {
    try {
      const existingTask = await this.getTask(id)
      const updatedTask = updateTask(existingTask, updates)
      
      const validation = validateTask(updatedTask)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid task update: ${errorList}`)
      }

      this.tasks.set(id, updatedTask)
      this.notifyListeners('taskUpdated', updatedTask)
      
      return updatedTask
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  }

  // Mark task as completed
  async completeTask(id) {
    try {
      return await this.updateSingleTask(id, { status: 'completed' })
    } catch (error) {
      console.error('Failed to complete task:', error)
      throw error
    }
  }

  // Mark task as skipped
  async skipTask(id) {
    try {
      return await this.updateSingleTask(id, { status: 'skipped' })
    } catch (error) {
      console.error('Failed to skip task:', error)
      throw error
    }
  }

  // Clone a task for easy repetition
  async cloneTask(id, newScheduledDate, newScheduledTime = null) {
    try {
      const originalTask = await this.getTask(id)
      
      const clonedTask = {
        ...originalTask,
        id: this.nextIntegerId++,
        scheduledDate: newScheduledDate,
        scheduledTime: newScheduledTime || originalTask.scheduledTime,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Regenerate slug with new ID
      const slugTitle = clonedTask.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      clonedTask.slug = `task-${clonedTask.id}-${slugTitle}`

      return await this.saveTask(clonedTask)
    } catch (error) {
      console.error('Failed to clone task:', error)
      throw error
    }
  }

  // Delete a task
  async deleteTask(id) {
    try {
      const task = await this.getTask(id)
      this.tasks.delete(id)
      this.notifyListeners('taskDeleted', task)
      
      return task
    } catch (error) {
      console.error('Failed to delete task:', error)
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
        console.error('Error in task service listener:', error)
      }
    })
  }

  // Utility methods
  async searchTasks(query) {
    try {
      const tasks = await this.getAllTasks()
      const lowerQuery = query.toLowerCase()
      
      return tasks.filter(task => 
        task.title.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Failed to search tasks:', error)
      throw error
    }
  }

  async getTaskCount() {
    try {
      return this.tasks.size
    } catch (error) {
      console.error('Failed to get task count:', error)
      throw error
    }
  }

  // Get tasks for today
  async getTodaysTasks() {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      return await this.getTasksByDate(today)
    } catch (error) {
      console.error('Failed to get today\'s tasks:', error)
      throw error
    }
  }

  // Get overdue tasks
  async getOverdueTasks() {
    try {
      const today = new Date().toISOString().split('T')[0]
      return Array.from(this.tasks.values())
        .filter(task => task.scheduledDate < today && task.status === 'scheduled')
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || '00:00'}`)
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || '00:00'}`)
          return dateA - dateB
        })
    } catch (error) {
      console.error('Failed to get overdue tasks:', error)
      throw error
    }
  }

  // Future: This will be replaced with actual persistence layer
  async exportData() {
    try {
      const tasks = await this.getAllTasks()
      return {
        tasks,
        nextIntegerId: this.nextIntegerId,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Failed to export task data:', error)
      throw error
    }
  }

  async importData(data) {
    try {
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid import data format')
      }

      this.tasks.clear()
      this.nextIntegerId = data.nextIntegerId || 1
      
      for (const task of data.tasks) {
        const validation = validateTask(task)
        if (validation.isValid) {
          this.tasks.set(task.id, task)
          if (task.id >= this.nextIntegerId) {
            this.nextIntegerId = task.id + 1
          }
        } else {
          const errorList = validation.errors.join(', ')
          console.warn(`Skipping invalid task during import: ${errorList}`)
        }
      }

      this.notifyListeners('dataImported', data)
      return this.tasks.size
    } catch (error) {
      console.error('Failed to import task data:', error)
      throw error
    }
  }
}

// Singleton instance
const taskService = new TaskService()

export default taskService