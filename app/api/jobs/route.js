import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/jobs - List jobs with optional filters
export async function GET(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const worker_id = searchParams.get('worker_id')
  const all = searchParams.get('all') // admin: get all jobs including cancelled/completed

  let query = supabase.from('jobs').select('*, claims(*, workers(full_name, phone))')

  if (status) query = query.eq('status', status)
  if (date) query = query.eq('job_date', date)
  if (from) query = query.gte('job_date', from)
  if (to) query = query.lte('job_date', to)

  query = query.order('job_date', { ascending: true }).order('start_time', { ascending: true })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If worker_id filter, only return jobs they claimed or open jobs
  if (worker_id) {
    const filtered = data.filter(job =>
      job.status === 'open' ||
      job.claims?.some(c => c.worker_id === worker_id)
    )
    return NextResponse.json(filtered)
  }

  return NextResponse.json(data)
}

// POST /api/jobs - Create a new job
export async function POST(request) {
  const supabase = createServerClient()
  const body = await request.json()

  const { title, location_address, location_city, job_date, start_time, duration_hours, pay_amount, job_type, urgency, notes, workers_needed, posted_by } = body

  if (!title || !job_date || !start_time || !pay_amount) {
    return NextResponse.json({ error: 'Title, date, time, and pay are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      title,
      location_address,
      location_city,
      job_date,
      start_time,
      duration_hours: duration_hours || 4,
      pay_amount,
      job_type: job_type || 'residential',
      urgency: urgency || 'today',
      notes,
      workers_needed: workers_needed || 1,
      posted_by,
    })
    .select('*, claims(*, workers(full_name))')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/jobs - Update a job
export async function PATCH(request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select('*, claims(*, workers(full_name, phone))')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/jobs - Delete a job (admin godmode)
export async function DELETE(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
  }

  // Delete all claims first (cascade should handle this, but be explicit)
  await supabase.from('claims').delete().eq('job_id', id)

  const { error } = await supabase.from('jobs').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
