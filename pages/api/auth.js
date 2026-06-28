import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const { method } = req

  // Verify PIN login
  if (method === 'POST' && req.body.action === 'verify') {
    const { pin } = req.body
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('pin', pin)
    if (error) return res.status(500).json({ error: error.message })
    if (data.length === 0) return res.status(401).json({ error: 'Invalid PIN' })
    return res.status(200).json({ user: data[0] })
  }

  // Get all users (for settings)
  if (method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, username')
      .order('id')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // Update PIN
  if (method === 'PUT') {
    const { id, pin, username } = req.body
    if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN must be at least 4 digits' })
    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({ pin, username })
      .eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
