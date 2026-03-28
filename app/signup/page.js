'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('en')
  const [form, setForm] = useState({
    full_name: '', phone: '', experience: '', areas: '',
    available_days: [true, true, true, true, true, false, false],
    earliest_start: '07:00', latest_end: '17:00',
    transportation: 'drives', language: 'en',
  })
  const [pin, setPin] = useState(['', '', '', ''])
  const pinRefs = [useRef(), useRef(), useRef(), useRef()]
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function handlePinChange(index, value) {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    if (value && index < 3) pinRefs[index + 1].current?.focus()
  }

  function toggleDay(i) {
    const days = [...form.available_days]
    days[i] = !days[i]
    setForm({ ...form, available_days: days })
  }

  async function handleSubmit() {
    setError('')
    const pinStr = pin.join('')
    if (pinStr.length !== 4) {
      setError('Please create a 4-digit PIN')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', ...form, pin: pinStr })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }
      setStep(3)
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-navy px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center text-base">🧹</div>
          <h1 className="font-display text-white text-base font-bold">SMC Job Board</h1>
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🧹</div>
          <h2 className="font-display text-[22px] font-bold mb-1">Join SMC Crew</h2>
          <p className="text-sm text-brand-text-secondary">Sylvia&apos;s Magic Cleaning — Paterson, NJ</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 justify-center mb-5">
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${step >= 1 ? 'bg-brand-teal border-brand-teal' : 'bg-brand-muted border-brand-border'} ${step > 1 ? 'bg-brand-green border-brand-green' : ''}`} />
          <div className={`w-6 h-0.5 ${step > 1 ? 'bg-brand-green' : 'bg-brand-border'}`} />
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${step >= 2 ? 'bg-brand-teal border-brand-teal' : 'bg-brand-muted border-brand-border'} ${step > 2 ? 'bg-brand-green border-brand-green' : ''}`} />
          <div className={`w-6 h-0.5 ${step > 2 ? 'bg-brand-green' : 'bg-brand-border'}`} />
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${step >= 3 ? 'bg-brand-green border-brand-green' : 'bg-brand-muted border-brand-border'}`} />
        </div>

        {/* Language toggle */}
        {step < 3 && (
          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => { setLang('en'); setForm({...form, language: 'en'}) }} className={`text-xs px-3 py-1 rounded-full font-semibold ${lang === 'en' ? 'bg-brand-teal text-white' : 'bg-brand-muted text-brand-text-secondary'}`}>English</button>
            <button onClick={() => { setLang('es'); setForm({...form, language: 'es'}) }} className={`text-xs px-3 py-1 rounded-full font-semibold ${lang === 'es' ? 'bg-brand-teal text-white' : 'bg-brand-muted text-brand-text-secondary'}`}>Español</button>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
            <div className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-3">Step 1 — Your Info</div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="e.g. Carmen Rivera" className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(973) 555-0142" className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Cleaning Experience</label>
              <select value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                <option value="">Select...</option>
                <option value="none">No experience (willing to learn)</option>
                <option value="less_than_1yr">Less than 1 year</option>
                <option value="1_to_3yr">1–3 years</option>
                <option value="3_plus_yr">3+ years</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Areas You Can Work (cities)</label>
              <input type="text" value={form.areas} onChange={e => setForm({...form, areas: e.target.value})} placeholder="e.g. Paterson, Clifton, Passaic" className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <button onClick={() => {
              if (!form.full_name || !form.phone) { setError('Name and phone are required'); return }
              setError(''); setStep(2)
            }} className="w-full py-3.5 bg-brand-teal text-white font-bold text-sm rounded-btn">Continue →</button>
            {error && <div className="bg-brand-red-bg text-brand-red text-xs font-semibold p-3 rounded-lg mt-3">{error}</div>}
            <div className="text-center mt-4">
              <span className="text-xs text-brand-text-muted">Already have an account? </span>
              <Link href="/login" className="text-xs text-brand-teal font-semibold">Log in →</Link>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
            <div className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-3">Step 2 — Availability</div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Which days can you work?</label>
              <div className="flex gap-1.5 flex-wrap">
                {dayLabels.map((day, i) => (
                  <button key={day} type="button" onClick={() => toggleDay(i)} className={`text-xs font-bold px-3 py-2 rounded-md ${form.available_days[i] ? 'bg-brand-teal text-white' : 'bg-brand-muted text-brand-text-muted'}`}>{day}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Earliest Start</label>
                <select value={form.earliest_start} onChange={e => setForm({...form, earliest_start: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                  <option value="06:00">6:00 AM</option><option value="07:00">7:00 AM</option><option value="08:00">8:00 AM</option><option value="09:00">9:00 AM</option><option value="10:00">10:00 AM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Latest End</label>
                <select value={form.latest_end} onChange={e => setForm({...form, latest_end: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                  <option value="15:00">3:00 PM</option><option value="16:00">4:00 PM</option><option value="17:00">5:00 PM</option><option value="18:00">6:00 PM</option><option value="19:00">7:00 PM</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Transportation</label>
              <select value={form.transportation} onChange={e => setForm({...form, transportation: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                <option value="drives">Yes — I drive</option><option value="transit">Yes — public transit</option><option value="none">No — I need rides</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Create a 4-Digit PIN</label>
              <div className="flex gap-2">
                {pin.map((d, i) => (
                  <input key={i} ref={pinRefs[i]} type="password" inputMode="numeric" maxLength={1} value={d} onChange={e => handlePinChange(i, e.target.value)} className="pin-input" />
                ))}
              </div>
              <div className="text-[11px] text-brand-text-muted mt-1.5">You&apos;ll use this PIN + your phone to log in</div>
            </div>
            {error && <div className="bg-brand-red-bg text-brand-red text-xs font-semibold p-3 rounded-lg mb-3">{error}</div>}
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 bg-brand-teal text-white font-bold text-sm rounded-btn disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Profile →'}
            </button>
            <button onClick={() => { setError(''); setStep(1) }} className="w-full py-2.5 mt-2 text-brand-teal font-semibold text-xs rounded-btn border-2 border-brand-teal bg-transparent">← Back</button>
          </div>
        )}

        {/* STEP 3 - Confirmation */}
        {step === 3 && (
          <div className="bg-white border border-brand-border rounded-card p-8 shadow-sm text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-display text-xl font-bold mb-2">Profile Submitted!</h3>
            <p className="text-sm text-brand-text-secondary leading-relaxed mb-5">
              Jose will review your profile and approve you soon. Once approved, you&apos;ll get a WhatsApp message and can start claiming jobs!
            </p>
            <div className="bg-brand-muted rounded-btn p-4 text-left">
              <div className="text-[11px] font-semibold text-brand-teal uppercase tracking-wider mb-2">What happens next</div>
              <div className="text-xs text-brand-text-secondary leading-[2.2]">
                1️⃣ Jose reviews your profile<br/>
                2️⃣ You get invited to the SMC Jobs WhatsApp group<br/>
                3️⃣ New jobs appear as WhatsApp messages<br/>
                4️⃣ Tap the link to claim — first come, first served!
              </div>
            </div>
            <Link href="/login" className="block w-full py-3 mt-5 bg-brand-teal text-white font-bold text-sm rounded-btn text-center">Go to Login →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
