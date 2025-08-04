
/**
 * DreamerService - Service layer for Dreamer authentication and user state
 * Handles authentication flows and user session management
 * Following Clean Architecture: Service layer coordinates authentication methods
 */

import config from '../../conf/svc.config.js'

import { createDreamer, updateDreamer, validateDreamer } from '../domain/Dreamer.js'

// localStorage key for tempToken persistence
const TEMP_TOKEN_STORAGE_KEY = 'dreamshepherd_temp_token'

class DreamerService {
  constructor() {
    this.currentDreamer = null
    this.accessJwt = '' //Current user's access token, stored in memory
    this.tempToken = '' //Temporary token for IntroUsers
    this.listeners = new Set() // Event listeners for auth state changes
  }

  async getDreamer() {
    if(this.currentDreamer) {
      return this.currentDreamer
    }

    this.currentDreamer = await this.fetchDreamer()

    return this.currentDreamer

  }

  async fetchDreamer(tempToken = '') {
    try {
      // Try JWT authentication first (if we have an access token)
      if (this.accessJwt) {
        const jwtDreamer = await this.fetchJWTDreamer()
        if (jwtDreamer) {
          return jwtDreamer
        }
      }

      // Try refresh token authentication
      const refreshDreamer = await this.fetchRefreshDreamer()
      if (refreshDreamer) {
        return refreshDreamer
      }

      // Finally, try IntroDreamer authentication (with tempToken or localStorage)
      const introDreamer = await this.fetchIntroDreamer(tempToken)
      if (introDreamer) {
        return introDreamer
      }

      // If all authentication methods fail, return anonymous dreamer
      return createDreamer({ type: 'anonymous' })

    } catch (error) {
      console.error('fetchDreamer failed:', error)
      return createDreamer({ type: 'anonymous' })
    }
  }

  /**
   * Attempt JWT authentication with /api/auth/me
   * @returns {Object|null} Authenticated dreamer or null if failed
   */
  async fetchJWTDreamer() {
    try {
      const requestOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessJwt}`,
          'Content-Type': 'application/json'
        }
      }

      console.log('Attempting JWT authentication with /api/auth/me')
      const response = await fetch(`${config.host}/api/auth/me`, requestOptions)

      if (response.ok) {
        const responseData = await response.json()
        console.log('JWT authentication successful:', responseData)
        
        const dreamerData = responseData.data || responseData
        return updateDreamer(createDreamer({ type: 'anonymous' }), {
          ...dreamerData,
          type: 'normal'
        })
      } else {
        console.log('JWT authentication failed, status:', response.status)
        // Clear invalid JWT
        this.accessJwt = ''
        return null
      }
    } catch (error) {
      console.error('fetchJWTDreamer error:', error)
      // Clear potentially invalid JWT
      this.accessJwt = ''
      return null
    }
  }

  /**
   * Attempt refresh token authentication with /api/auth/refresh
   * @returns {Object|null} Authenticated dreamer or null if failed
   */
  async fetchRefreshDreamer() {
    try {
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include httpOnly cookies
      }

      console.log('Attempting refresh token authentication with /api/auth/refresh')
      const response = await fetch(`${config.host}/api/auth/refresh`, requestOptions)

      if (response.ok) {
        const responseData = await response.json()
        console.log('Refresh token authentication successful:', responseData)
        
        // Update our JWT with the new access token
        this.accessJwt = responseData.data?.accessToken || responseData.accessToken || ''
        
        const dreamerData = responseData.data?.dreamer || responseData.dreamer || {}
        return updateDreamer(createDreamer({ type: 'anonymous' }), {
          ...dreamerData,
          type: 'normal'
        })
      } else {
        console.log('Refresh token authentication failed, status:', response.status)
        return null
      }
    } catch (error) {
      console.error('fetchRefreshDreamer error:', error)
      return null
    }
  }

  /**
   * Attempt IntroDreamer authentication with tempToken
   * @param {string} tempToken - Optional tempToken parameter
   * @returns {Object|null} Authenticated IntroDreamer or null if failed
   */
  async fetchIntroDreamer(tempToken = '') {
    try {
      // First, ensure we should attempt IntroDreamer authentication
      if (this.accessJwt) {
        throw new Error('Cannot authenticate as IntroDreamer: Already have JWT token')
      }
      
      if (this.currentDreamer && this.currentDreamer.type === 'normal') {
        throw new Error('Cannot authenticate as IntroDreamer: Already authenticated as normal dreamer')
      }

      // Get tempToken from parameter or localStorage
      let tokenToUse = tempToken
      if (!tokenToUse) {
        tokenToUse = localStorage.getItem(TEMP_TOKEN_STORAGE_KEY)
        if (!tokenToUse) {
          console.log('No tempToken provided and none found in localStorage')
          return null
        }
        console.log('Found tempToken in localStorage, attempting authentication')
      }

      // Validate tempToken format (basic check)
      if (typeof tokenToUse !== 'string' || tokenToUse.length < 10) {
        console.warn('Invalid tempToken format')
        if (!tempToken) {
          // Only remove from localStorage if we got it from there
          localStorage.removeItem(TEMP_TOKEN_STORAGE_KEY)
          console.log('Invalid tempToken removed from localStorage')
        }
        return null
      }

      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }

      console.log('Attempting IntroDreamer authentication with /api/auth/intro/:token')
      const response = await fetch(`${config.host}/api/auth/intro/${tokenToUse}`, requestOptions)

      if (response.ok) {
        const responseData = await response.json()
        console.log('IntroDreamer authentication successful:', responseData)
        
        const introDreamerData = responseData.data || responseData
        this.tempToken = tokenToUse
        
        return updateDreamer(createDreamer({ type: 'anonymous' }), {
          ...introDreamerData,
          type: 'intro'
        })
      } else {
        console.log('IntroDreamer authentication failed, status:', response.status)
        
        // Remove invalid tempToken from localStorage if we got it from there
        if (!tempToken) {
          localStorage.removeItem(TEMP_TOKEN_STORAGE_KEY)
          console.log('Invalid tempToken removed from localStorage')
        }
        
        return null
      }
    } catch (error) {
      console.error('fetchIntroDreamer error:', error)
      
      // If error and we got token from localStorage, remove it
      if (!tempToken) {
        localStorage.removeItem(TEMP_TOKEN_STORAGE_KEY)
        console.log('TempToken removed from localStorage due to error')
      }
      
      return null
    }
  }


  /**
   * Get the last edited dream slug for authenticated user
   */
  async getLastDreamSlug(dreamerId) {
    try {
      // PLACEHOLDER: Call API to get dreams ordered by updatedAt desc
      // const response = await fetch(`/api/dreams?limit=1&orderBy=updatedAt&order=desc`)
      // const dreams = await response.json()
      // return dreams.length > 0 ? dreams[0].slug : null

      // TODO: Replace with actual API call
      return null
    } catch (error) {
      console.error('Failed to get last dream slug:', error)
      return null
    }
  }


  /**
   * Create an intro dreamer via API call
   * @param {string} email - Email address for the intro dreamer
   * @param {string} reminderDate - ISO date string for reminder (optional)
   * @param {string} reminderTime - Time string for reminder (optional)
   * @returns {Object} { success: boolean, tempToken: string|null, dreamer: Object|null, errors: Array }
   */
  async createIntroDreamer(email, dreamTitle, dreamVision = null,
      reminderDate = null, reminderTime = null) {

    try {
      // Create and validate dreamer object first
      const introDreamer = createDreamer({
        type: 'intro',
        email
      });

      const validation = validateDreamer(introDreamer);
      if (!validation.isValid) {
        return {
          success: false,
          tempToken: null,
          dreamer: null,
          errors: validation.errors
        };
      }

      // Prepare API request data
      const requestData = {
        email: introDreamer.email,
        dreamTitle: dreamTitle
      };

      if(dreamVision) {
        requestData.dreamVision = dreamVision
      }

      // Add reminder scheduling if provided
      if (reminderDate && reminderTime) {
        requestData.reminderDateTime = `${reminderDate}T${reminderTime}`;
      }

      console.log('Creating intro dreamer with data:', requestData);

      // Make API call to create intro dreamer
      const response = await fetch(`${config.host}/api/auth/intro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const responseData = await response.json();
        const introDreamerData = responseData.data
        console.log('Intro dreamer creation response:', responseData.data);

        // Update current dreamer and temp token
        this.currentDreamer = updateDreamer(introDreamer, {
          type: 'intro',
          email: introDreamerData.email || introDreamer.email
        });
        this.tempToken = introDreamerData.tempToken || '';

        // Save tempToken to localStorage for automatic re-authentication
        if (this.tempToken) {
          localStorage.setItem(TEMP_TOKEN_STORAGE_KEY, this.tempToken)
          console.log('Saved tempToken to localStorage for automatic re-authentication')
        }

        // Notify listeners of auth state change
        this.notifyListeners('authStateChanged', {
          isAuthenticated: true,
          dreamer: this.currentDreamer
        });

        return {
          success: true,
          tempToken: this.tempToken,
          dreamer: this.currentDreamer,
          errors: []
        };
      } else {
        // Handle API errors
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error creating intro dreamer:', errorData);

        return {
          success: false,
          tempToken: null,
          dreamer: null,
          errors: [errorData.error || 'Failed to create reminder']
        };
      }

    } catch (error) {
      console.error('Failed to create intro dreamer:', error);
      return {
        success: false,
        tempToken: null,
        dreamer: null,
        errors: ['Network error. Please try again.']
      };
    }
  }

  /**
   * Sign out current dreamer
   */
  async signOut() {
    try {
      // PLACEHOLDER: Call logout endpoint to invalidate tokens
      // await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })

      this.currentDreamer = null
      this.tempToken = ''
      this.notifyListeners('authStateChanged', { isAuthenticated: false, dreamer: null })

      return true
    } catch (error) {
      console.error('Sign out failed:', error)
      return false
    }
  }

  // Event system for UI reactivity
  addListener(listener) {
    this.listeners.add(listener)
  }

  removeListener(listener) {
    this.listeners.delete(listener)
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }
}

// Singleton instance
const dreamerService = new DreamerService()
export default dreamerService
