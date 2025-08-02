
/**
 * DreamerService - Service layer for Dreamer authentication and user state
 * Handles authentication flows and user session management
 * Following Clean Architecture: Service layer coordinates authentication methods
 */

import config from '../../conf/svc.config.js'

import { createDreamer, updateDreamer, validateDreamer } from '../domain/Dreamer.js'

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
    //TODO: Update this method when we understand how to check status of response

    const newDreamer = createDreamer({ type: 'anonymous' })

    if(tempToken) {
      //Hit /auth/intro/:token and get intro dreamer
      const resp = await fetch(`${config.host}/api/auth/intro/${tempToken}`)
      console.log('Response from intro')
      console.dir(resp)
      return updateDreamer(newDreamer, {...resp.data, type: 'intro'})
    }

    //Hit /auth/me and get full dreamer
    if(this.accessJwt) {
      const resp = await fetch(`${config.host}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.accessJwt}` }
      })
      console.log('Response from auth/me')
      console.dir(resp)
      return updateDreamer(newDreamer, {...resp.data, type: 'normal'})
    }

    //If response from /auth/me is not 200, try to refresh at /auth/refresh
    const resp = await fetch(`${config.host}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include' // Include httpOnly cookies
    })

    console.log('Response from auth/refresh')
    console.dir(resp)
    if(resp.status === 200) {
      this.accessJwt = resp.data.accessToken
      return updateDreamer(newDreamer, {...resp.data.dreamer, type: 'normal'})
    }

    //If response from auth/refresh is not 200, this is an anonymous user
    return newDreamer

  }

  /**
   * Main authentication method - determines auth type and delegates to specific method
   * @param {Object} authData - Contains various auth tokens/credentials
   * @returns {Object} { isAuthenticated: boolean, dreamer: Object|null, lastDreamSlug: string|null }
   */
  async authenticateDreamer(authData = {}) {
    try {
      // Try JWT authentication first (fastest)
      if (authData.jwtToken) {
        return await this.authenticateJWT(authData.jwtToken)
      }

      // Try refresh token authentication
      if (authData.refreshToken || authData.attemptRefresh) {
        return await this.authenticateRefresh()
      }

      // Try tempToken authentication (IntroDreamer)
      if (authData.tempToken) {
        return await this.authenticateTemp(authData.tempToken)
      }

      // Try username/password authentication
      if (authData.username && authData.password) {
        return await this.authenticatePassword(authData.username, authData.password)
      }

      // No authentication data provided - anonymous user
      return this.createAnonymousResult()

    } catch (error) {
      console.error('Authentication failed:', error)
      return this.createAnonymousResult()
    }
  }

  /**
   * Authenticate using JWT access token
   */
  async authenticateJWT(jwtToken) {
    try {
      // TODO: Validate JWT token structure and expiration locally if needed
      // For now, assume valid if present

      // PLACEHOLDER: Call API to validate JWT and get user data
      // const response = await fetch('/api/auth/validate', {
      //   headers: { 'Authorization': `Bearer ${jwtToken}` }
      // })

      // TODO: Replace with actual API call
      return this.createAuthenticatedResult({
        id: 'jwt-user-id',
        email: 'jwt-user@example.com',
        type: 'dreamer'
      }, 'sample-dream-slug')

    } catch (error) {
      console.error('JWT authentication failed:', error)
      return this.createAnonymousResult()
    }
  }

  /**
   * Authenticate using refresh token (httpOnly cookie)
   */
  async authenticateRefresh() {
    try {
      // PLACEHOLDER: Call refresh endpoint with httpOnly cookies
      // const response = await fetch('/api/auth/refresh', {
      //   method: 'POST',
      //   credentials: 'include' // Include httpOnly cookies
      // })
      //
      // if (response.ok) {
      //   const userData = await response.json()
      //   const lastDreamSlug = await this.getLastDreamSlug(userData.id)
      //   return this.createAuthenticatedResult(userData, lastDreamSlug)
      // }

      // TODO: Replace with actual API call
      return this.createAnonymousResult()

    } catch (error) {
      console.error('Refresh token authentication failed:', error)
      return this.createAnonymousResult()
    }
  }

  /**
   * Authenticate using tempToken (IntroDreamer)
   */
  async authenticateTemp(tempToken) {
    try {
      // PLACEHOLDER: Validate tempToken with backend
      // const response = await fetch('/api/auth/temp-validate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ tempToken })
      // })
      //
      // if (response.ok) {
      //   const introDreamerData = await response.json()
      //   const lastDreamSlug = introDreamerData.dreamSlug // IntroDreamers typically have one dream
      //   return this.createAuthenticatedResult(introDreamerData, lastDreamSlug)
      // }

      // TODO: Replace with actual API call
      return this.createAnonymousResult()

    } catch (error) {
      console.error('TempToken authentication failed:', error)
      return this.createAnonymousResult()
    }
  }

  /**
   * Authenticate using username/password
   */
  async authenticatePassword(username, password) {
    try {
      // PLACEHOLDER: Call login endpoint
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: username, password })
      // })
      //
      // if (response.ok) {
      //   const userData = await response.json()
      //   const lastDreamSlug = await this.getLastDreamSlug(userData.id)
      //   return this.createAuthenticatedResult(userData, lastDreamSlug)
      // }

      // TODO: Replace with actual API call
      return this.createAnonymousResult()

    } catch (error) {
      console.error('Password authentication failed:', error)
      return this.createAnonymousResult()
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
   * Create successful authentication result
   */
  createAuthenticatedResult(dreamer, lastDreamSlug) {
    this.currentDreamer = dreamer
    this.notifyListeners('authStateChanged', { isAuthenticated: true, dreamer })

    return {
      isAuthenticated: true,
      dreamer,
      lastDreamSlug,
      hasSeenIntro: true // If they're authenticated, they've been here before
    }
  }

  /**
   * Create anonymous user result
   */
  createAnonymousResult() {
    this.currentDreamer = null
    this.notifyListeners('authStateChanged', { isAuthenticated: false, dreamer: null })

    return {
      isAuthenticated: false,
      dreamer: null,
      lastDreamSlug: null,
      hasSeenIntro: false
    }
  }

  /**
   * Get current dreamer
   */
  getCurrentDreamer() {
    return this.currentDreamer
  }

  /**
   * Create an intro dreamer via API call
   * @param {string} email - Email address for the intro dreamer
   * @param {string} reminderDate - ISO date string for reminder (optional)
   * @param {string} reminderTime - Time string for reminder (optional)
   * @returns {Object} { success: boolean, tempToken: string|null, dreamer: Object|null, errors: Array }
   */
  async createIntroDreamer(email, reminderDate = null, reminderTime = null) {
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
        email: introDreamer.email
      };

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
        console.log('Intro dreamer creation response:', responseData);

        // Update current dreamer and temp token
        this.currentDreamer = updateDreamer(introDreamer, {
          type: 'intro',
          email: responseData.email || introDreamer.email
        });
        this.tempToken = responseData.tempToken || '';

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
