import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { normalizePhone } from '@/lib/utils'

// POST /api/auth - Login or Signup
export async function POST(request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { action } = body

  if (action === 'login') {
    return handleLogin(supabase, body)
  } else if (action === 'signup') {
    return handleSignup(supabase, body)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function handleLogin(supabase, { phone, pin }) {
  if (!phone || !pin) {
    return NextResponse.json({ error: 'Phone and PIN required' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)
  const { data: worker, error } = await supabase
    .from('workers')
    .select('*')
    .eq('phone', normalized)
    .single()

  if (error || !worker) {
    return NextResponse.json({ error: 'Account not found. Check your phone number or sign up.' }, { status: 401 })
  }

  const pinValid = await bcrypt.compare(pin, worker.pin_hash)
  if (!pinValid) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  if (worker.status === 'pending') {
    return NextResponse.json({ error: 'Tu cuenta está pendiente de aprobación. ¡Sylvia te aprobará pronto! / Your account is pending approval. Sylvia will approve you soon!' }, { status: 403 })
  }

  if (worker.status === 'denied') {
    return NextResponse.json({ error: 'Your account was not approved.' }, { status: 403 })
  }

  // Update last_active
  await supabase.from('workers').update({ last_active: new Date().toISOString() }).eq('id', worker.id)

  const { pin_hash, ...safeWorker } = worker
  return NextResponse.json({ worker: safeWorker })
}

async function handleSignup(supabase, { full_name, phone, pin, experience, areas, available_days, earliest_start, latest_end, transportation, language }) {
  if (!full_name || !phone || !pin || pin.length !== 4) {
    return NextResponse.json({ error: 'Name, phone, and 4-digit PIN required' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)

  // Check if phone already exists
  const { data: existing } = await supabase
    .from('workers')
    .select('id')
    .eq('phone', normalized)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'An account with this phone number already exists. Try logging in.' }, { status: 409 })
  }

  const pinHash = await bcrypt.hash(pin, 10)
  const areasArray = typeof areas === 'string'
    ? areas.split(',').map(a => a.trim()).filter(Boolean)
    : areas || []

  const { data: worker, error } = await supabase
    .from('workers')
    .insert({
      full_name,
      phone: normalized,
      pin_hash: pinHash,
      experience: experience || 'none',
      areas: areasArray,
      available_days: available_days || [true, true, true, true, true, false, false],
      earliest_start: earliest_start || '07:00',
      latest_end: latest_end || '17:00',
      transportation: transportation || 'drives',
      language: language || 'es',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  const { pin_hash, ...safeWorker } = worker
  return NextResponse.json({ worker: safeWorker, message: 'Profile submitted! Waiting for approval.' })
}
