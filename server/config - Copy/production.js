export const config = {
  apiUrl: process.env.REACT_APP_API_URL || '/api',
  socketUrl: process.env.REACT_APP_SOCKET_URL || window.location.origin,
  environment: process.env.REACT_APP_ENVIRONMENT || 'production',
  
  // Add error tracking
  sentryDsn: process.env.REACT_APP_SENTRY_DSN,
  
  // Analytics
  googleAnalyticsId: process.env.REACT_APP_GA_ID,
  
  // Feature flags
  features: {
    enableChat: true,
    enableCustomization: true,
    enablePayments: true,
  },
};