/**
 * GoalService - Service layer for Goal operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */

import { updateGoal, validateGoal } from '../domain/Goal.js'

class GoalService {
  constructor() {
    this.goals = new Map() // In-memory storage for now
    this.listeners = new Set() // Event listeners for state changes
  }

  // Create a new goal
  async saveGoal(goal) {
    try {
      const validation = validateGoal(goal)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid goal: ${errorList}`)
      }

      this.goals.set(goal.id, goal)
      this.notifyListeners('goalSaved', goal)
      
      return goal
    } catch (error) {
      console.error('Failed to save goal:', error)
      throw error
    }
  }

  // Get a goal by ID
  async getGoal(id) {
    try {
      const goal = this.goals.get(id)
      if (!goal) {
        throw new Error(`Goal with id ${id} not found`)
      }
      return goal
    } catch (error) {
      console.error('Failed to get goal:', error)
      throw error
    }
  }

  // Get a goal by slug
  async getGoalBySlug(slug) {
    try {
      const goal = Array.from(this.goals.values()).find(g => g.slug === slug)
      if (!goal) {
        throw new Error(`Goal with slug ${slug} not found`)
      }
      return goal
    } catch (error) {
      console.error('Failed to get goal by slug:', error)
      throw error
    }
  }

  // Get all goals
  async getAllGoals() {
    try {
      return Array.from(this.goals.values())
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get all goals:', error)
      throw error
    }
  }

  // Get goals by dream ID
  async getGoalsByDreamId(dreamId) {
    try {
      return Array.from(this.goals.values())
        .filter(goal => goal.dreamIds.includes(dreamId))
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get goals by dream ID:', error)
      throw error
    }
  }

  // Get goals by category
  async getGoalsByCategory(category) {
    try {
      return Array.from(this.goals.values())
        .filter(goal => goal.category === category)
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get goals by category:', error)
      throw error
    }
  }

  // Get goals by time horizon
  async getGoalsByTimeHorizon(timeHorizon) {
    try {
      return Array.from(this.goals.values())
        .filter(goal => goal.timeHorizon === timeHorizon)
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get goals by time horizon:', error)
      throw error
    }
  }

  // Get goals by status
  async getGoalsByStatus(status) {
    try {
      return Array.from(this.goals.values())
        .filter(goal => goal.status === status)
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get goals by status:', error)
      throw error
    }
  }

  // Update an existing goal
  async updateSingleGoal(id, updates) {
    try {
      const existingGoal = await this.getGoal(id)
      const updatedGoal = updateGoal(existingGoal, updates)
      
      const validation = validateGoal(updatedGoal)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid goal update: ${errorList}`)
      }

      this.goals.set(id, updatedGoal)
      this.notifyListeners('goalUpdated', updatedGoal)
      
      return updatedGoal
    } catch (error) {
      console.error('Failed to update goal:', error)
      throw error
    }
  }

  // Delete a goal
  async deleteGoal(id) {
    try {
      const goal = await this.getGoal(id)
      this.goals.delete(id)
      this.notifyListeners('goalDeleted', goal)
      
      return goal
    } catch (error) {
      console.error('Failed to delete goal:', error)
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
        console.error('Error in goal service listener:', error)
      }
    })
  }

  // Utility methods
  async searchGoals(query) {
    try {
      const goals = await this.getAllGoals()
      const lowerQuery = query.toLowerCase()
      
      return goals.filter(goal => 
        goal.title.toLowerCase().includes(lowerQuery) ||
        goal.description.toLowerCase().includes(lowerQuery) ||
        goal.target.toLowerCase().includes(lowerQuery) ||
        goal.relevance.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Failed to search goals:', error)
      throw error
    }
  }

  async getGoalCount() {
    try {
      return this.goals.size
    } catch (error) {
      console.error('Failed to get goal count:', error)
      throw error
    }
  }

  // Get goals approaching their deadlines
  async getUpcomingGoals(daysAhead = 30) {
    try {
      const goals = await this.getGoalsByStatus('active')
      const now = new Date()
      const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000))
      
      return goals.filter(goal => {
        const deadline = new Date(goal.timeLimit)
        return deadline >= now && deadline <= futureDate
      }).sort((a, b) => {
        return new Date(a.timeLimit) - new Date(b.timeLimit)
      })
    } catch (error) {
      console.error('Failed to get upcoming goals:', error)
      throw error
    }
  }

  // Future: This will be replaced with actual persistence layer
  async exportData() {
    try {
      const goals = await this.getAllGoals()
      return {
        goals,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Failed to export goal data:', error)
      throw error
    }
  }

  async importData(data) {
    try {
      if (!data.goals || !Array.isArray(data.goals)) {
        throw new Error('Invalid import data format')
      }

      this.goals.clear()
      
      for (const goal of data.goals) {
        const validation = validateGoal(goal)
        if (validation.isValid) {
          this.goals.set(goal.id, goal)
        } else {
          const errorList = validation.errors.join(', ')
          console.warn(`Skipping invalid goal during import: ${errorList}`)
        }
      }

      this.notifyListeners('dataImported', data)
      return this.goals.size
    } catch (error) {
      console.error('Failed to import goal data:', error)
      throw error
    }
  }
}

// Singleton instance
const goalService = new GoalService()

export default goalService