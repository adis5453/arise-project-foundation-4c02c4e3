const CACHE_NAME = 'arise-hrm-v1.0.0'
const STATIC_CACHE = 'arise-hrm-static-v1.0.0'
const DYNAMIC_CACHE = 'arise-hrm-dynamic-v1.0.0'
const API_CACHE = 'arise-hrm-api-v1.0.0'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/static/media/logo.192.png',
  '/static/media/logo.512.png'
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth',
  '/api/employees',
  '/api/attendance',
  '/api/leave',
  '/api/payroll'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Static files cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Error caching static files:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (isStaticFile(request)) {
    event.respondWith(handleStaticFile(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else {
    event.respondWith(handleDynamicRequest(request))
  }
})

// Check if request is for a static file
function isStaticFile(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/static/') ||
         url.pathname.startsWith('/manifest.json') ||
         url.pathname.startsWith('/favicon.ico') ||
         url.pathname === '/' ||
         url.pathname === '/index.html'
}

// Check if request is for an API endpoint
function isAPIRequest(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/') ||
         url.hostname === 'supabase.co'
}

// Handle static file requests
async function handleStaticFile(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback to network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('Error handling static file:', error)
    
    // Return offline page if available
    const offlineResponse = await caches.match('/offline.html')
    if (offlineResponse) {
      return offlineResponse
    }
    
    throw error
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('API request failed, trying cache:', error)
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Network error', 
        message: 'Please check your connection and try again' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Dynamic request failed, trying cache:', error)
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Handle background sync
async function doBackgroundSync() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        await processPendingAction(action)
        await removePendingAction(action.id)
      } catch (error) {
        console.error('Failed to process pending action:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Get pending actions from IndexedDB
async function getPendingActions() {
  // This would integrate with your IndexedDB implementation
  return []
}

// Process a pending action
async function processPendingAction(action) {
  // Process different types of actions
  switch (action.type) {
    case 'attendance':
      return processAttendanceAction(action)
    case 'leave_request':
      return processLeaveRequestAction(action)
    case 'performance_review':
      return processPerformanceReviewAction(action)
    default:
      console.warn('Unknown action type:', action.type)
  }
}

// Process attendance action
async function processAttendanceAction(action) {
  const response = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to process attendance action')
  }
  
  return response.json()
}

// Process leave request action
async function processLeaveRequestAction(action) {
  const response = await fetch('/api/leave/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to process leave request action')
  }
  
  return response.json()
}

// Process performance review action
async function processPerformanceReviewAction(action) {
  const response = await fetch('/api/performance/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to process performance review action')
  }
  
  return response.json()
}

// Remove pending action from IndexedDB
async function removePendingAction(actionId) {
  // This would integrate with your IndexedDB implementation
  console.log('Removing pending action:', actionId)
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Arise HRM',
    icon: '/static/media/logo.192.png',
    badge: '/static/media/logo.192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/static/media/logo.192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/static/media/logo.192.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Arise HRM', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches())
  }
})

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
  console.log('All caches cleared')
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cacheNames = await caches.keys()
    
    for (const cacheName of cacheNames) {
      if (cacheName === STATIC_CACHE) continue
      
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      // Remove old cached items (older than 7 days)
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const date = response.headers.get('date')
          if (date && (Date.now() - new Date(date).getTime()) > 7 * 24 * 60 * 60 * 1000) {
            await cache.delete(request)
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error)
  }
}, 24 * 60 * 60 * 1000) // Run every 24 hours
