/**
 * Configuration settings for the InstaClone application
 * Edit these values to customize the application behavior
 */

/**
 * Post visibility settings
 * Controls when posts become publicly visible on user profiles
 * All times are in GMT/UTC
 */
export const postVisibility = {
  // Hour of the day (0-23) when posts become publicly visible (GMT)
  releaseHour: 9, // 6:00 PM GMT
  
  // Minute of the hour (0-59) when posts become publicly visible
  releaseMinute: 0, // 6:00 PM GMT exactly
  
  // Whether to use GMT for all time calculations
  useGMT: true,
};

/**
 * Recent activity feed settings
 * Controls the display of recent posts on the homepage
 */
export const recentActivity = {
  // Number of past release times to include in the recent activity feed
  pastReleasesDisplayed: 3,
  
  // Label to display above the recent activity feed
  // Use {pastReleasesDisplayed} as a placeholder to insert the value
  feedLabel: "Last {pastReleasesDisplayed} days",
};

/**
 * Fake engagement settings
 * Controls the display of fake engagement metrics
 */
export const fakeEngagement = {
  // Enable or disable fake like counts
  enableFakeLikes: true,
  
  // Range for random like counts (inclusive)
  likesMin: 0,
  likesMax: 100,
};

/**
 * Viewing history settings
 * Controls the behavior of the viewing history feature
 */
export const viewingHistory = {
  // Number of days to keep viewing history
  maxAgeDays: 7,
  
  // Maximum number of entries to display
  maxEntries: 50,
};

/**
 * Upload limits settings
 * Controls the number of posts a user can upload
 */
export const uploadLimits = {
  // Maximum number of posts a user can upload per day
  dailyLimit: 3,
};

/**
 * Layout settings
 * Controls the default layout for different views
 */
export const layoutSettings = {
  // Default layout for different views:
  // 'grid' - Multiple columns of images in a grid
  // 'single' - Single column with full post details
  defaultLayout: 'grid',
};