'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { translations } from '@/lib/i18n'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('es')
  const [form, setForm] = useState({
    full_name: '', phone: '', experience: '', areas: '',
    available_days: [true, true, true, true, true, false, false],
    earliest_start: '07:00', latest_end: '17:00',
    transportation: 'drives', language: 'es',
  })
  const [pin, setPin] = useState(['', '', '', ''])
  const pinRefs = [useRef(), useRef(), useRef(), useRef()]

  const i = translations[lang] || translations.en

  useEffect(() => {
    const saved = localStorage.getItem('smc_lang')
    if (saved === 'es' || saved === 'en') {
      setLang(saved)
      setForm(f => ({ ...f, language: saved }))
    }
  }, [])

  function switchLang(l) {
    setLang(l)
    localStorage.setItem('smc_lang', l)
    setForm(f => ({ ...f, language: l }))
  }

  function handlePinChange(index, value) {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    if (value && index < 3) pinRefs[index + 1].current?.focus()
  }

  function toggleDay(idx) {
    const days = [...form.available_days]
    days[idx] = !days[idx]
    setForm({ ...form, available_days: days })
  }

  async function handleSubmit() {
    setError('')
    const pinStr = pin.join('')
    if (pinStr.length !== 4) {
      setError(i.createPinError)
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
      setError(i.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-navy px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center text-base">🧹</div>
            <h1 className="font-display text-white text-base font-bold">SMC Job Board</h1>
          </div>
          {/* Language toggle in header */}
          {step < 3 && (
            <div className="flex gap-1">
              <button onClick={() => switchLang('en')} className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${lang === 'en' ? 'bg-brand-teal text-white' : 'bg-white/20 text-white/70'}`}>EN</button>
              <button onClick={() => switchLang('es')} className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${lang === 'es' ? 'bg-brand-teal text-white' : 'bg-white/20 text-white/70'}`}>ES</button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🧹</div>
          <h2 className="font-display text-[22px] font-bold mb-1">{i.joinTitle}</h2>
          <p className="text-sm text-brand-text-secondary">{i.companyName} — Paterson, NJ</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 justify-center mb-5">
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${step >= 1 ? 'bg-brand-teal border-brand-teal' : 'bg-brand-muted border-brand-border'} ${step > 1 ? 'bg-brand-green border-brand-green' : ''}`} />
          <div className={`w-6 h-0.5 ${step > 1 ? 'bg-brand-green' : 'bg-brand-border'}`} />
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${step >= 2 ? 'bg-brand-teal border-brand-teal' : 'bg-brand-muted border-brand-border'} ${step > 2 ? 'bg-brand-green border-brand-green' : ''}`} />
          <div className={`w-6 h-0.5 ${step > 2 ? 'bg-brand-green' : 'bg-brand-border'}`} />
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${step >= 3 ? 'bg-brand-green border-brand-green' : 'bg-brand-muted border-brand-border'}`} />
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
            <div className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-3">{i.step1Title}</div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.fullName}</label>
              <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder={lang === 'es' ? 'ej. Carmen Rivera' : 'e.g. Carmen Rivera'} className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.phoneNumber}</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(973) 555-0142" className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.experience}</label>
              <select value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                <option value="">{lang === 'es' ? 'Seleccionar...' : 'Select...'}</option>
                <option value="none">{i.expNone}</option>
                <option value="less_than_1yr">{i.expLess1}</option>
                <option value="1_to_3yr">{i.exp1to3}</option>
                <option value="3_plus_yr">{i.exp3plus}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.areas}</label>
              <input type="text" value={form.areas} onChange={e => setForm({...form, areas: e.target.value})} placeholder={lang === 'es' ? 'ej. Paterson, Clifton, Passaic' : 'e.g. Paterson, Clifton, Passaic'} className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <button onClick={() => {
              if (!form.full_name || !form.phone) { setError(i.namePhoneRequired); return }
              setError(''); setStep(2)
            }} className="w-full py-3.5 bg-brand-teal text-white font-bold text-sm rounded-btn">{i.continueBtn}</button>
            {error && <div className="bg-brand-red-bg text-brand-red text-xs font-semibold p-3 rounded-lg mt-3">{error}</div>}
            <div className="text-center mt-4">
              <span className="text-xs text-brand-text-muted">{i.alreadyHaveAccount} </span>
              <Link href="/login" className="text-xs text-brand-teal font-semibold">{i.loginLinkFull}</Link>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
            <div className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-3">{i.step2Title}</div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">{i.whichDays}</label>
              <div className="flex gap-1.5 flex-wrap">
                {i.days.map((day, idx) => (
                  <button key={day} type="button" onClick={() => toggleDay(idx)} className={`text-xs font-bold px-3 py-2 rounded-md ${form.available_days[idx] ? 'bg-brand-teal text-white' : 'bg-brand-muted text-brand-text-muted'}`}>{day}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.earliestStart}</label>
                <select value={form.earliest_start} onChange={e => setForm({...form, earliest_start: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                  <option value="06:00">6:00 AM</option>
                  <option value="07:00">7:00 AM</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.latestEnd}</label>
                <select value={form.latest_end} onChange={e => setForm({...form, latest_end: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.transportation}</label>
              <select value={form.transportation} onChange={e => setForm({...form, transportation: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                <option value="drives">{i.transDrives}</option>
                <option value="transit">{i.transTransit}</option>
                <option value="none">{i.transNone}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">{i.createPin}</label>
              <div className="flex gap-2">
                {pin.map((d, idx) => (
                  <input key={idx} ref={pinRefs[idx]} type="password" inputMode="numeric" maxLength={1} value={d} onChange={e => handlePinChange(idx, e.target.value)} className="pin-input" />
                ))}
              </div>
              <div className="text-[11px] text-brand-text-muted mt-1.5">{i.pinNote}</div>
            </div>
            {error && <div className="bg-brand-red-bg text-brand-red text-xs font-semibold p-3 rounded-lg mb-3">{error}</div>}
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 bg-brand-teal text-white font-bold text-sm rounded-btn disabled:opacity-50">
              {loading ? i.submitting : i.submitProfileBtn}
            </button>
            <button onClick={() => { setError(''); setStep(1) }} className="w-full py-2.5 mt-2 text-brand-teal font-semibold text-xs rounded-btn border-2 border-brand-teal bg-transparent">{i.back}</button>
          </div>
        )}

        {/* STEP 3 - Confirmation */}
        {step === 3 && (
          <div className="bg-white border border-brand-border rounded-card p-8 shadow-sm text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-display text-xl font-bold mb-2">{i.profileSubmitted}</h3>
            <p className="text-sm text-brand-text-secondary leading-relaxed mb-5">
              {i.waitingApproval}
            </p>
            <div className="bg-brand-muted rounded-btn p-4 text-left">
              <div className="text-[11px] font-semibold text-brand-teal uppercase tracking-wider mb-2">{i.whatNext}</div>
              <div className="text-xs text-brand-text-secondary leading-[2.2]">
                {i.next1}<br/>
                {i.next2}<br/>
                {i.next3}<br/>
                {i.next4}
              </div>
            </div>
            <Link href="/login" className="block w-full py-3 mt-5 bg-brand-teal text-white font-bold text-sm rounded-btn text-center">{i.goToLogin}</Link>
          </div>
        )}
      </div>
    </div>
  )
}
