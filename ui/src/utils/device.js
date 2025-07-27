// Device detection utilities

/**
 * Simple mobile device detection
 * @returns {boolean} True if the device is likely mobile
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
}

/**
 * Check if device is tablet-sized
 * @returns {boolean} True if the device is likely a tablet
 */
export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * Check if device is desktop-sized
 * @returns {boolean} True if the device is likely desktop
 */
export const isDesktop = () => {
  return window.innerWidth >= 1024
}

/**
 * Cross-browser UUID generation with fallback for mobile
 * @returns {string} A UUID string
 */
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}