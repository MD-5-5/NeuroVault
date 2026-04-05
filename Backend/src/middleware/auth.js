import supabase from '../config/supabase.js'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' })
    }

    const token = authHeader.split(' ')[1]
    
    // Supabase auth.getUser() verifies the JWT natively
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please login again.' })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err.message)
    res.status(500).json({ error: 'Internal server error during authentication' })
  }
}
