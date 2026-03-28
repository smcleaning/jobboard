'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pinRefs = [useRef(), useRef(), useRef(), useRef()]

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
      setError('Enter your phone number and 4-digit PIN')
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
        setError(data.error || 'Login failed')
        return
      }
      localStorage.setItem('smc_worker', JSON.stringify(data.worker))
      if (data.worker.is_admin) {
        router.push('/admin')
      } else {
        router.push('/worker')
      }
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
          <div>
            <h1 className="font-display text-white text-base font-bold">SMC Job Board</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pt-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧹</div>
          <h2 className="font-display text-[22px] font-bold mb-1">SMC Worker Portal</h2>
          <p className="text-sm text-brand-text-secondary">Sylvia&apos;s Magic Cleaning</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
            <div className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-3.5">Log In</div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(973) 555-0142"
                className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm bg-white focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">4-Digit PIN</label>
              <div className="flex gap-2 justify-center">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
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
              {loading ? 'Logging in...' : 'Log In →'}
            </button>

            <div className="text-center mt-4">
              <span className="text-xs text-brand-text-muted">New here? </span>
              <Link href="/signup" className="text-xs text-brand-teal font-semibold">Sign up →</Link>
            </div>
          </div>
        </form>

        <div className="bg-brand-muted rounded-btn p-3.5 mt-4">
          <div className="text-[11px] font-semibold text-brand-teal mb-1">📌 Bookmark this page!</div>
          <div className="text-[11px] text-brand-text-secondary leading-relaxed">
            Save this page to your home screen for quick access. You can also find the link pinned in the SMC WhatsApp group.
          </div>
        </div>
      </div>
    </div>
  )
}
