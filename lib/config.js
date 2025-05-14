/**
 * Configuration settings for the InstaClone application
 * Edit these values to customize the application behavior
 */

/**
 * Post visibility settings
 * Controls when posts become publicly visible on user profiles
 */
export const postVisibility = {
  // Hour of the day (0-23) when posts become publicly visible
  releaseHour: 9, // 9:00 AM
  
  // Minute of the hour (0-59) when posts become publicly visible
  releaseMinute: 0, // 9:00 AM exactly
};

/**
 * Recent activity feed settings
 * Controls the display of recent posts on the homepage
 */
export const recentActivity = {
  // Maximum age of posts to show in the recent activity feed (in hours)
  maxAgeHours: 72,
  
  // Label to display above the recent activity feed
  // Use {hours} as a placeholder to insert the maxAgeHours value
  feedLabel: "Last {hours} hours",
};