import supabase from '../config/supabase.js'

export async function authMiddleware(req, res, next) {
  try {
    // STEP 1: API KEY CHECK (IntelliSeek ke liye)
    const apiKey = req.headers['x-vault-api-key']

    if (apiKey && apiKey === process.env.VAULT_API_KEY) {
      return next() // allow without JWT
    }

    // STEP 2: EXISTING JWT FLOW (unchanged)
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' })
    }

    const token = authHeader.split(' ')[1]

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please login again.' })
    }

    req.user = user
    next()

  } catch (err) {
    console.error('Auth middleware error:', err.message)
    res.status(500).json({ error: 'Internal server error during authentication' })
  }
}