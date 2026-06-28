import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const { method } = req

  if (method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('store_expenses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (method === 'POST') {
    const { data, error } = await supabaseAdmin
      .from('store_expenses')
      .insert([req.body])
      .select()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data[0])
  }

  if (method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabaseAdmin
      .from('store_expenses')
      .delete()
      .eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
