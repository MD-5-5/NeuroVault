const BACKEND_URL = 'http://localhost:5000'
const SUPABASE_URL = 'https://sotapwusshuoomgjydnl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdGFwd3Vzc2h1b29tZ2p5ZG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTE2NTksImV4cCI6MjA4OTk4NzY1OX0.ayyF23MXha6NTIiujbm5SHCcGwWAZ65nafyuONZohzQ' // paste your anon key here

// ── DOM Elements ──
const loadingState = document.getElementById('loadingState')
const loggedOut = document.getElementById('loggedOut')
const loggedIn = document.getElementById('loggedIn')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const saveBtn = document.getElementById('saveBtn')
const saveBtnText = document.getElementById('saveBtnText')
const userNote = document.getElementById('userNote')
const pageTitle = document.getElementById('pageTitle')
const pageUrl = document.getElementById('pageUrl')
const authError = document.getElementById('authError')
const statusSuccess = document.getElementById('statusSuccess')
const statusError = document.getElementById('statusError')

let currentUser = null
let currentTab = null

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB' }, (response) => {
    if (response) {
      currentTab = response
      pageTitle.textContent = response.title || 'Unknown page'
      pageUrl.textContent = response.url || ''
    }
  })

  // Check if user is already logged in
  const stored = await getStoredSession()
  if (stored?.access_token && stored?.user) {
    currentUser = stored.user
    showLoggedIn()
  } else {
    showLoggedOut()
  }
})

// LOGIN
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()

  if (!email || !password) {
    showAuthError('Please enter email and password')
    return
  }

  loginBtn.disabled = true
  loginBtn.textContent = 'Signing in...'
  hideAuthError()

  try {
    // CALL SUPABASE AUTH ENDPOINT (NOT MY BACKEND)
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (data.error || !data.access_token) {
      showAuthError(data.error_description || data.msg || 'Login failed')
      return
    }

    // Store session
    await storeSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user
    })

    currentUser = data.user
    showLoggedIn()

  } catch (err) {
    showAuthError('Connection failed. Is the app running?')
  } finally {
    loginBtn.disabled = false
    loginBtn.textContent = 'Sign In'
  }
})

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove('neurovault_session')
  currentUser = null
  showLoggedOut()
})

// ── Save ──
saveBtn.addEventListener('click', async () => {
  if (!currentTab?.url) {
    showSaveError('Could not get page URL')
    return
  }

  if (!currentUser?.id) {
    showSaveError('Not logged in')
    return
  }

  // Don't save chrome:// or extension pages
  if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
    showSaveError("Can't save browser internal pages")
    return
  }

  saveBtn.disabled = true
  saveBtnText.textContent = '🧠 Saving...'
  hideStatus()

  try {
    const note = userNote.value.trim()

    const res = await fetch(`${BACKEND_URL}/api/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: currentTab.url,
        user_id: currentUser.id,
        user_note: note || null
      })
    })

    const data = await res.json()

    if (data.success) {
      statusSuccess.classList.remove('hidden')
      saveBtnText.textContent = '✅ Saved!'
      userNote.value = ''

      // Reset after 3 seconds
      setTimeout(() => {
        statusSuccess.classList.add('hidden')
        saveBtnText.textContent = '⚡ Save to Vault'
        saveBtn.disabled = false
      }, 3000)
    } else {
      showSaveError(data.error || 'Save failed')
      saveBtn.disabled = false
      saveBtnText.textContent = '⚡ Save to Vault'
    }

  } catch (err) {
    showSaveError('Backend not reachable. Is it running?')
    saveBtn.disabled = false
    saveBtnText.textContent = '⚡ Save to Vault'
  }
})

// ── Allow Enter key on login ──
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click()
})

//UI HELPER
function showLoggedIn() {
  loadingState.classList.add('hidden')
  loggedOut.classList.add('hidden')
  loggedIn.classList.remove('hidden')
}

function showLoggedOut() {
  loadingState.classList.add('hidden')
  loggedIn.classList.add('hidden')
  loggedOut.classList.remove('hidden')
}

function showAuthError(msg) {
  authError.textContent = msg
  authError.classList.remove('hidden')
}

function hideAuthError() {
  authError.classList.add('hidden')
}

function showSaveError(msg) {
  statusError.textContent = '❌ ' + msg
  statusError.classList.remove('hidden')
}

function hideStatus() {
  statusSuccess.classList.add('hidden')
  statusError.classList.add('hidden')
}

//STORAGE SESSION
async function storeSession(session) {
  return chrome.storage.local.set({ neurovault_session: session })
}

//RETRIEVE SESSION
async function getStoredSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get('neurovault_session', (result) => {
      resolve(result.neurovault_session || null)
    })
  })
}