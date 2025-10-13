// This service worker intercepts fetch requests to append Firebase Auth ID tokens
// to headers for SSR authentication.
// @ts-nocheck
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, getIdToken, onAuthStateChanged } from 'firebase/auth'
import { firebaseConfig } from './firebase/config'

const appName = 'lean-ehr-assisted-living-client'
let firebaseApp = getApps().find((app) => app?.name === appName)
if (!firebaseApp) {
  firebaseApp = initializeApp(firebaseConfig, appName)
}

// Helper to get request body for non-GET requests
const getBodyContent = (req: Request) => {
  return new Promise((resolve) => {
    if (req.method !== 'GET') {
      req
        .clone()
        .text()
        .then(resolve)
        .catch(() => resolve(undefined))
    } else {
      resolve(undefined)
    }
  })
}

self.addEventListener('install', () => {
  // Force the waiting service worker to become the active service worker.
  console.log('[SW] Installing new version...')
  self.skipWaiting()
})

self.addEventListener('message', (event) => {
  const { type } = event.data || {}
  if (type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting...')
    self.skipWaiting()
  }
})

const auth = getAuth(firebaseApp)
const getIdTokenWrapper = async () => {
  const unsubscribe = await onAuthStateChanged(auth, (user) => {
    unsuscribe()
    if (user) return getIdToken(user)
    return null
  })
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const evt = event

  // Only intercept requests to your own origin that are for HTML documents (SSR requests)
  const url = new URL(evt.request.url)
  const isStatic = /\.(js|css|png|jpg|jpeg|svg|gif|ico|json)$/.test(
    url.pathname,
  )

  if (evt.request.url.startsWith(self.location.origin) && !isStatic) {
    evt.respondWith(
      (async function () {
        let idToken = null

        try {
          // Get the ID token, refreshing it if necessary
          idToken = await getIdTokenWrapper() // Do not force a refresh
          console.log('id token: ', idToken)
        } catch (error) {
          console.error('Service Worker: Failed to get ID token:', error) // Error: failed to get ID token: FirebaseError: Firebase: Error (auth/invalid-refresh-token).
        }

        let req = evt.request
        if (idToken) {
          // Clone headers as request headers are immutable.
          const headers = new Headers()
          req.headers.forEach((val, key) => {
            headers.append(key, val)
          })
          // Add ID token to header.
          headers.append('Authorization', `Bearer ${idToken}`)

          // Recreate the request with the new headers and potentially the body
          try {
            const body = await getBodyContent(req)
            req = new Request(req.url, {
              method: req.method,
              headers: headers,
              mode: 'same-origin',
              credentials: req.credentials,
              cache: req.cache,
              redirect: req.redirect,
              referrer: req.referrer,
              body: body || null, // body can be null for GET/HEAD
            })
          } catch (e) {
            console.error(
              'Service Worker: Failed to create new Request with body',
              e,
            )
            // Fallback to original request if body processing fails
            req = evt.request
          }
        }

        // Proceed with the (potentially modified) request
        return fetch(req)
      })(),
    )
  }
})

// Activate event listener for the service worker
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating new version...')
  event.waitUntil(clients.claim())
})
