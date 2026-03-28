'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const worker = localStorage.getItem('smc_worker')
    if (worker) {
      const parsed = JSON.parse(worker)
      if (parsed.is_admin) {
        router.replace('/admin')
      } else {
        router.replace('/worker')
      }
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🧹</div>
        <p className="text-brand-text-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}
