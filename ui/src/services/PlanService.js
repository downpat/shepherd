/**
 * PlanService - Service layer for Plan operations
 * Handles data persistence, business logic coordination, and external concerns
 * Following Clean Architecture: Service layer can use domain, cannot use UI
 */

import { updatePlan, validatePlan, updateMissionStatement } from '../domain/Plan.js'

class PlanService {
  constructor() {
    this.plans = new Map() // In-memory storage for now
    this.listeners = new Set() // Event listeners for state changes
  }

  // Create a new plan
  async savePlan(plan) {
    try {
      const validation = validatePlan(plan)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid plan: ${errorList}`)
      }

      this.plans.set(plan.id, plan)
      this.notifyListeners('planSaved', plan)
      
      return plan
    } catch (error) {
      console.error('Failed to save plan:', error)
      throw error
    }
  }

  // Get a plan by ID
  async getPlan(id) {
    try {
      const plan = this.plans.get(id)
      if (!plan) {
        throw new Error(`Plan with id ${id} not found`)
      }
      return plan
    } catch (error) {
      console.error('Failed to get plan:', error)
      throw error
    }
  }

  // Get a plan by slug
  async getPlanBySlug(slug) {
    try {
      const plan = Array.from(this.plans.values()).find(p => p.slug === slug)
      if (!plan) {
        throw new Error(`Plan with slug ${slug} not found`)
      }
      return plan
    } catch (error) {
      console.error('Failed to get plan by slug:', error)
      throw error
    }
  }

  // Get plan by goal ID (one-to-one relationship)
  async getPlanByGoalId(goalId) {
    try {
      const plan = Array.from(this.plans.values()).find(p => p.goalId === goalId)
      if (!plan) {
        throw new Error(`Plan for goal ${goalId} not found`)
      }
      return plan
    } catch (error) {
      console.error('Failed to get plan by goal ID:', error)
      throw error
    }
  }

  // Get all plans
  async getAllPlans() {
    try {
      return Array.from(this.plans.values())
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get all plans:', error)
      throw error
    }
  }

  // Get plans by status
  async getPlansByStatus(status) {
    try {
      return Array.from(this.plans.values())
        .filter(plan => plan.status === status)
        .sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
    } catch (error) {
      console.error('Failed to get plans by status:', error)
      throw error
    }
  }

  // Update an existing plan
  async updateSinglePlan(id, updates) {
    try {
      const existingPlan = await this.getPlan(id)
      const updatedPlan = updatePlan(existingPlan, updates)
      
      const validation = validatePlan(updatedPlan)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid plan update: ${errorList}`)
      }

      this.plans.set(id, updatedPlan)
      this.notifyListeners('planUpdated', updatedPlan)
      
      return updatedPlan
    } catch (error) {
      console.error('Failed to update plan:', error)
      throw error
    }
  }

  // Add a new mission version to a plan
  async addPlanMissionVersion(id, newMission, reason) {
    try {
      const existingPlan = await this.getPlan(id)
      const updatedPlan = updateMissionStatement(existingPlan, newMission, reason)
      
      const validation = validatePlan(updatedPlan)
      if (!validation.isValid) {
        const errorList = validation.errors.join(', ')
        throw new Error(`Invalid plan after mission update: ${errorList}`)
      }

      this.plans.set(id, updatedPlan)
      this.notifyListeners('planMissionUpdated', updatedPlan)
      
      return updatedPlan
    } catch (error) {
      console.error('Failed to add mission version:', error)
      throw error
    }
  }

  // Delete a plan
  async deletePlan(id) {
    try {
      const plan = await this.getPlan(id)
      this.plans.delete(id)
      this.notifyListeners('planDeleted', plan)
      
      return plan
    } catch (error) {
      console.error('Failed to delete plan:', error)
      throw error
    }
  }

  // Add task to plan
  async addTaskToPlan(planId, taskId) {
    try {
      const plan = await this.getPlan(planId)
      if (!plan.taskIds.includes(taskId)) {
        const updatedPlan = updatePlan(plan, {
          taskIds: [...plan.taskIds, taskId]
        })
        
        this.plans.set(planId, updatedPlan)
        this.notifyListeners('taskAddedToPlan', { plan: updatedPlan, taskId })
        
        return updatedPlan
      }
      return plan
    } catch (error) {
      console.error('Failed to add task to plan:', error)
      throw error
    }
  }

  // Remove task from plan
  async removeTaskFromPlan(planId, taskId) {
    try {
      const plan = await this.getPlan(planId)
      const updatedPlan = updatePlan(plan, {
        taskIds: plan.taskIds.filter(id => id !== taskId)
      })
      
      this.plans.set(planId, updatedPlan)
      this.notifyListeners('taskRemovedFromPlan', { plan: updatedPlan, taskId })
      
      return updatedPlan
    } catch (error) {
      console.error('Failed to remove task from plan:', error)
      throw error
    }
  }

  // Add session to plan
  async addSessionToPlan(planId, sessionId) {
    try {
      const plan = await this.getPlan(planId)
      if (!plan.sessionIds.includes(sessionId)) {
        const updatedPlan = updatePlan(plan, {
          sessionIds: [...plan.sessionIds, sessionId]
        })
        
        this.plans.set(planId, updatedPlan)
        this.notifyListeners('sessionAddedToPlan', { plan: updatedPlan, sessionId })
        
        return updatedPlan
      }
      return plan
    } catch (error) {
      console.error('Failed to add session to plan:', error)
      throw error
    }
  }

  // Remove session from plan
  async removeSessionFromPlan(planId, sessionId) {
    try {
      const plan = await this.getPlan(planId)
      const updatedPlan = updatePlan(plan, {
        sessionIds: plan.sessionIds.filter(id => id !== sessionId)
      })
      
      this.plans.set(planId, updatedPlan)
      this.notifyListeners('sessionRemovedFromPlan', { plan: updatedPlan, sessionId })
      
      return updatedPlan
    } catch (error) {
      console.error('Failed to remove session from plan:', error)
      throw error
    }
  }

  // Add habit to plan
  async addHabitToPlan(planId, habitId) {
    try {
      const plan = await this.getPlan(planId)
      if (!plan.habitIds.includes(habitId)) {
        const updatedPlan = updatePlan(plan, {
          habitIds: [...plan.habitIds, habitId]
        })
        
        this.plans.set(planId, updatedPlan)
        this.notifyListeners('habitAddedToPlan', { plan: updatedPlan, habitId })
        
        return updatedPlan
      }
      return plan
    } catch (error) {
      console.error('Failed to add habit to plan:', error)
      throw error
    }
  }

  // Remove habit from plan
  async removeHabitFromPlan(planId, habitId) {
    try {
      const plan = await this.getPlan(planId)
      const updatedPlan = updatePlan(plan, {
        habitIds: plan.habitIds.filter(id => id !== habitId)
      })
      
      this.plans.set(planId, updatedPlan)
      this.notifyListeners('habitRemovedFromPlan', { plan: updatedPlan, habitId })
      
      return updatedPlan
    } catch (error) {
      console.error('Failed to remove habit from plan:', error)
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
        console.error('Error in plan service listener:', error)
      }
    })
  }

  // Utility methods
  async searchPlans(query) {
    try {
      const plans = await this.getAllPlans()
      const lowerQuery = query.toLowerCase()
      
      return plans.filter(plan => 
        plan.title.toLowerCase().includes(lowerQuery) ||
        plan.description.toLowerCase().includes(lowerQuery) ||
        plan.currentMission.statement.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Failed to search plans:', error)
      throw error
    }
  }

  async getPlanCount() {
    try {
      return this.plans.size
    } catch (error) {
      console.error('Failed to get plan count:', error)
      throw error
    }
  }

  // Get plan statistics
  async getPlanStatistics(planId) {
    try {
      const plan = await this.getPlan(planId)
      return {
        taskCount: plan.taskIds.length,
        sessionCount: plan.sessionIds.length,
        habitCount: plan.habitIds.length,
        missionVersionCount: plan.missionHistory.length,
        ...plan.statistics
      }
    } catch (error) {
      console.error('Failed to get plan statistics:', error)
      throw error
    }
  }

  // Future: This will be replaced with actual persistence layer
  async exportData() {
    try {
      const plans = await this.getAllPlans()
      return {
        plans,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Failed to export plan data:', error)
      throw error
    }
  }

  async importData(data) {
    try {
      if (!data.plans || !Array.isArray(data.plans)) {
        throw new Error('Invalid import data format')
      }

      this.plans.clear()
      
      for (const plan of data.plans) {
        const validation = validatePlan(plan)
        if (validation.isValid) {
          this.plans.set(plan.id, plan)
        } else {
          const errorList = validation.errors.join(', ')
          console.warn(`Skipping invalid plan during import: ${errorList}`)
        }
      }

      this.notifyListeners('dataImported', data)
      return this.plans.size
    } catch (error) {
      console.error('Failed to import plan data:', error)
      throw error
    }
  }
}

// Singleton instance
const planService = new PlanService()

export default planService