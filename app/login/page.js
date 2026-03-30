'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { translations } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('es')
  const pinRefs = [useRef(), useRef(), useRef(), useRef()]

  const i = translations[lang] || translations.en

  useEffect(() => {
    const saved = localStorage.getItem('smc_lang')
    if (saved === 'en' || saved === 'es') setLang(saved)
  }, [])

  function switchLang(l) {
    setLang(l)
    localStorage.setItem('smc_lang', l)
  }

  function handlePinChange(index, value) {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    if (value && index < 3) pinRefs[index + 1].current?.focus()
  }

  function handlePinKeyDown(index, e) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    const pinStr = pin.join('')
    if (!phone || pinStr.length !== 4) {
      setError(i.enterPhonePin)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone, pin: pinStr })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || i.login + ' failed')
        return
      }
      localStorage.setItem('smc_worker', JSON.stringify(data.worker))
      // Save worker's preferred language
      if (data.worker.language) {
        setLang(data.worker.language)
        localStorage.setItem('smc_lang', data.worker.language)
      }
      if (data.worker.is_admin) {
        router.push('/admin')
      } else {
        router.push('/worker')
      }
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
          {/* Language toggle */}
          <div className="flex gap-1">
            <button onClick={() => switchLang('en')} className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${lang === 'en' ? 'bg-brand-teal text-white' : 'bg-white/20 text-white/70'}`}>EN</button>
            <button onClick={() => switchLang('es')} className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${lang === 'es' ? 'bg-brand-teal text-white' : 'bg-white/20 text-white/70'}`}>ES</button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧹</div>
          <h2 className="font-display text-[22px] font-bold mb-1">{i.portalTitle}</h2>
          <p className="text-sm text-brand-text-secondary">{i.companyName}</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
            <div className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-3.5">{i.login}</div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.phoneNumber}</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(973) 555-0142"
                className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm bg-white focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">{i.pin}</label>
              <div className="flex gap-2 justify-center">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={pinRefs[idx]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(idx, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(idx, e)}
                    className="pin-input"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-brand-red-bg text-brand-red text-xs font-semibold p-3 rounded-lg mb-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-teal text-white font-bold text-sm rounded-btn transition-all active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? i.loggingIn : i.loginBtn}
            </button>

            <div className="text-center mt-4">
              <span className="text-xs text-brand-text-muted">{i.newHere} </span>
              <Link href="/signup" className="text-xs text-brand-teal font-semibold">{i.signUpFull}</Link>
            </div>
          </div>
        </form>

        <div className="bg-brand-muted rounded-btn p-3.5 mt-4">
          <div className="text-[11px] font-semibold text-brand-teal mb-1">{i.bookmarkTitle}</div>
          <div className="text-[11px] text-brand-text-secondary leading-relaxed">
            {i.bookmarkBody}
          </div>
        </div>
      </div>
    </div>
  )
}
