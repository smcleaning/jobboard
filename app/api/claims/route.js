import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/claims - Claim a job (or admin force-assign)
export async function POST(request) {
  const supabase = createServerClient()
  const { job_id, worker_id, force, transportation } = await request.json()

  if (!job_id || !worker_id) {
    return NextResponse.json({ error: 'Job ID and worker ID required' }, { status: 400 })
  }

  // Check job exists
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', job_id)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Skip capacity checks if admin force-assign
  if (!force) {
    if (job.status === 'filled') {
      return NextResponse.json({ error: 'This job is already filled' }, { status: 409 })
    }

    if (job.workers_claimed >= job.workers_needed) {
      return NextResponse.json({ error: 'All spots for this job have been taken' }, { status: 409 })
    }
  }

  // Check worker hasn't already claimed
  const { data: existing } = await supabase
    .from('claims')
    .select('id')
    .eq('job_id', job_id)
    .eq('worker_id', worker_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Worker already assigned to this job' }, { status: 409 })
  }

  // Create claim (trigger will update job.workers_claimed and job.status)
  const { data: claim, error } = await supabase
    .from('claims')
    .insert({ job_id, worker_id, transportation: transportation || null })
    .select('*, jobs(title), workers(full_name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Race condition guard: re-count active claims immediately after insert.
  // If two workers claimed simultaneously and this one pushed us over capacity,
  // delete this claim and return "already filled".
  if (!force) {
    const { count: claimCount } = await supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', job_id)
      .eq('status', 'claimed')

    const { data: freshJob } = await supabase
      .from('jobs')
      .select('workers_needed')
      .eq('id', job_id)
      .single()

    if (freshJob && claimCount > freshJob.workers_needed) {
      // Someone else slipped in — undo this claim
      await supabase.from('claims').delete().eq('id', claim.id)
      return NextResponse.json({ error: '¡Este trabajo ya fue tomado por otra persona! / This job was just taken by someone else!' }, { status: 409 })
    }
  }

  // If force-assigning beyond capacity, bump workers_needed
  if (force && job.workers_claimed >= job.workers_needed) {
    await supabase
      .from('jobs')
      .update({ workers_needed: job.workers_needed + 1 })
      .eq('id', job_id)
  }

  return NextResponse.json(claim)
}

// PATCH /api/claims - Update claim status (mark completed, no-show, etc.)
export async function PATCH(request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Claim ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('claims')
    .update(updates)
    .eq('id', id)
    .select('*, jobs(title), workers(full_name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/claims - Cancel/remove a claim
export async function DELETE(request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const claim_id = searchParams.get('id')

  if (!claim_id) {
    return NextResponse.json({ error: 'Claim ID required' }, { status: 400 })
  }

  // Get claim details before deleting so we can update the job
  const { data: claim } = await supabase
    .from('claims')
    .select('job_id')
    .eq('id', claim_id)
    .single()

  const { error } = await supabase
    .from('claims')
    .delete()
    .eq('id', claim_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Reopen the job if it was filled
  if (claim) {
    const { data: remainingClaims } = await supabase
      .from('claims')
      .select('id')
      .eq('job_id', claim.job_id)
      .eq('status', 'claimed')

    const { data: job } = await supabase
      .from('jobs')
      .select('workers_needed')
      .eq('id', claim.job_id)
      .single()

    if (job) {
      const claimedCount = remainingClaims?.length || 0
      await supabase
        .from('jobs')
        .update({
          workers_claimed: claimedCount,
          status: claimedCount >= job.workers_needed ? 'filled' : 'open'
        })
        .eq('id', claim.job_id)
    }
  }

  return NextResponse.json({ success: true })
}
