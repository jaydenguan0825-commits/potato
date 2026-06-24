export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/signup' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { email, username, password } = body || {}
        if (!email || !username || !password) {
          return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }

        // Ensure users table exists
        await env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            username TEXT UNIQUE,
            password_hash TEXT,
            created_at TEXT
          )`
        ).run()

        // Hash password (SHA-256)
        const pwBytes = new TextEncoder().encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', pwBytes)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const id = crypto.randomUUID()
        const createdAt = new Date().toISOString()

        const insert = env.DB.prepare('INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
        await insert.bind(id, email, username, hashHex, createdAt).run()

        return new Response(JSON.stringify({ success: true, userId: id }), { status: 201, headers: { 'Content-Type': 'application/json' } })
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }
    }

    return new Response('Not found', { status: 404 })
  }
}
