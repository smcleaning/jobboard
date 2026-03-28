import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/workers - List workers with optional filters
export async function GET(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const id = searchParams.get('id')
  const all = searchParams.get('all') // admin: get ALL workers regardless of status

  if (id) {
    const { data, error } = await supabase
      .from('workers')
      .select('*, claims(*, jobs(*))')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { pin_hash, ...safe } = data
    return NextResponse.json(safe)
  }

  let query = supabase.from('workers').select('*')
  if (status) query = query.eq('status', status)
  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const safe = data.map(({ pin_hash, ...rest }) => rest)
  return NextResponse.json(safe)
}

// PATCH /api/workers - Update worker (approve, deny, update availability, toggle admin, etc.)
export async function PATCH(request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Worker ID required' }, { status: 400 })
  }

  // If approving, set approved_at
  if (updates.status === 'approved') {
    updates.approved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('workers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { pin_hash, ...safe } = data
  return NextResponse.json(safe)
}

// DELETE /api/workers - Delete a worker (admin godmode)
export async function DELETE(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Worker ID required' }, { status: 400 })
  }

  // Delete their claims first
  await supabase.from('claims').delete().eq('worker_id', id)

  const { error } = await supabase.from('workers').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
