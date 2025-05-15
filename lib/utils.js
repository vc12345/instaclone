/**
 * Utility functions for the InstaClone application
 */

/**
 * Format a date relative to now (e.g., "2 hours ago", "yesterday")
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 86400); // days
  if (interval >= 7) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }
  if (interval >= 1) {
    return interval === 1 ? "yesterday" : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600); // hours
  if (interval >= 1) {
    return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
  }
  
  interval = Math.floor(seconds / 60); // minutes
  if (interval >= 1) {
    return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  return 'just now';
}

/**
 * Format a date in a standard format
 * @param {string|Date} dateString - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  const defaultOptions = { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Generate a random number within a range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random number within the range
 */
export function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate academic year options (YYYY/YY format)
 * @param {number} startYear - First year to include
 * @param {number} endYear - Last year to include (defaults to current academic year)
 * @param {number} limit - Maximum number of years to return
 * @returns {Array} Array of academic year strings in YYYY/YY format
 */
export function generateAcademicYears(startYear = 1980, endYear = null, limit = 10) {
  const years = [];
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  
  // If we're before September (month 8), use last year as the current academic year start
  // Otherwise use current year
  const currentAcademicYearStart = currentMonth < 8 
    ? now.getFullYear() - 1 
    : now.getFullYear();
  
  const lastYear = endYear || currentAcademicYearStart;
  
  // Only return the most recent 'limit' years
  const effectiveStartYear = Math.max(startYear, lastYear - limit + 1);
  
  for (let year = lastYear; year >= effectiveStartYear; year--) {
    const nextYearShort = (year + 1).toString().slice(-2);
    years.push(`${year}/${nextYearShort}`);
  }
  
  return years;
}