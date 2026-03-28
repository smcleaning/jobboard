'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import Tabs from '@/components/Tabs'
import JobCard from '@/components/JobCard'
import Toast, { showToast } from '@/components/Toast'
import { formatMoney, formatTime, formatDate, getDayLabel, weekStartStr, todayStr } from '@/lib/utils'

export default function WorkerPage() {
  const router = useRouter()
  const [worker, setWorker] = useState(null)
  const [tab, setTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('smc_worker')
    if (!stored) { router.replace('/login'); return }
    const w = JSON.parse(stored)
    if (w.is_admin) { router.replace('/admin'); return }
    if (w.status !== 'approved') { router.replace('/login'); return }
    setWorker(w)
  }, [router])

  const fetchJobs = useCallback(async () => {
    if (!worker) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs?worker_id=${worker.id}&from=${todayStr()}`)
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch { }
    setLoading(false)
  }, [worker])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  async function claimJob(jobId) {
    setClaiming(jobId)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, worker_id: worker.id })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed to claim', 'error'); return }
      showToast('✓ Job claimed!', 'success')
      fetchJobs()
    } catch { showToast('Connection error', 'error') }
    finally { setClaiming(null) }
  }

  function logout() {
    localStorage.removeItem('smc_worker')
    router.replace('/login')
  }

  if (!worker) return null

  const initials = worker.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const openJobs = jobs.filter(j => j.status === 'open' && !j.claims?.some(c => c.worker_id === worker.id))
  const claimedJobs = jobs.filter(j => j.claims?.some(c => c.worker_id === worker.id))

  // Group claimed jobs by date for schedule
  const scheduleByDate = {}
  claimedJobs.forEach(j => {
    const key = j.job_date
    if (!scheduleByDate[key]) scheduleByDate[key] = []
    scheduleByDate[key].push(j)
  })
  const sortedDates = Object.keys(scheduleByDate).sort()

  // Pay calculations
  const weekStart = weekStartStr()
  const weekClaimed = claimedJobs.filter(j => j.job_date >= weekStart)
  const weekPay = weekClaimed.reduce((s, j) => s + Number(j.pay_amount), 0)
  const monthClaimed = claimedJobs // already filtered from today onwards, approximate
  const monthPay = monthClaimed.reduce((s, j) => s + Number(j.pay_amount), 0)

  const tabs = [
    { id: 'jobs', icon: '📋', label: 'Jobs' },
    { id: 'schedule', icon: '📅', label: 'My Week' },
    { id: 'pay', icon: '💰', label: 'My Pay' },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <Toast />
      <TopBar title="SMC Job Board" subtitle={worker.full_name} initials={initials} onLogout={logout} />
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      <div className="px-4 pt-4 pb-24">
        {/* JOBS TAB */}
        {tab === 'jobs' && (
          <>
            <h2 className="font-display text-xl font-bold mb-3">Available Jobs</h2>
            {loading ? (
              <div className="text-center py-8 text-sm text-brand-text-muted">Loading...</div>
            ) : openJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🧹</div>
                <p className="text-sm text-brand-text-secondary">No open jobs right now. Check back soon!</p>
              </div>
            ) : (
              openJobs.map(job => (
                <JobCard key={job.id} job={job} workerView showClaim onClaim={claimJob} claiming={claiming === job.id} />
              ))
            )}

            {claimedJobs.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold mt-5 mb-3">My Claimed Jobs</h2>
                {claimedJobs.map(job => (
                  <div key={job.id} className="bg-white border border-brand-border rounded-card p-4 mb-3 shadow-sm border-l-4 border-l-brand-green">
                    <div className="font-bold text-sm mb-1">{job.title}</div>
                    <div className="text-xs text-brand-text-secondary">
                      {getDayLabel(job.job_date)} {formatTime(job.start_time)} · {job.location_city || ''} · {formatMoney(job.pay_amount)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* SCHEDULE TAB */}
        {tab === 'schedule' && (
          <>
            <h2 className="font-display text-xl font-bold mb-3">My Schedule</h2>
            <div className="bg-brand-teal text-white rounded-btn p-3.5 mb-4 flex justify-between items-center">
              <div>
                <div className="text-[11px] opacity-70">Today&apos;s availability</div>
                <div className="font-bold text-sm">
                  {worker.today_available === 'available' ? 'Available' : worker.today_available === 'partial' ? 'Partial' : 'Off'}
                  {worker.today_available !== 'unavailable' && ` — ${formatTime(worker.earliest_start)} to ${formatTime(worker.latest_end)}`}
                </div>
              </div>
            </div>

            {sortedDates.length === 0 ? (
              <div className="text-center py-12 text-sm text-brand-text-muted">No jobs scheduled yet</div>
            ) : (
              sortedDates.map(date => (
                <div key={date}>
                  <div className="text-[11px] font-bold text-brand-teal uppercase tracking-wider py-3 border-b border-brand-muted mb-2">
                    {getDayLabel(date)} — {formatDate(date)}
                  </div>
                  {scheduleByDate[date].map(job => (
                    <div key={job.id} className="flex items-center gap-3 py-2.5 border-b border-brand-muted last:border-0">
                      <div className="text-xs text-brand-teal font-semibold w-[60px] shrink-0">{formatTime(job.start_time)}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-[13px]">{job.title}</div>
                        <div className="text-[11px] text-brand-text-secondary">{job.location_city || job.location_address || ''}</div>
                      </div>
                      <div className="font-display text-sm font-bold text-brand-teal">{formatMoney(job.pay_amount)}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {/* PAY TAB */}
        {tab === 'pay' && (
          <>
            <h2 className="font-display text-xl font-bold mb-3">My Earnings</h2>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">This Week</div>
                <div className="font-display text-2xl font-bold text-brand-teal">{formatMoney(weekPay)}</div>
                <div className="text-[11px] text-brand-text-secondary mt-0.5">{weekClaimed.length} jobs</div>
              </div>
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">Upcoming</div>
                <div className="font-display text-2xl font-bold">{formatMoney(monthPay)}</div>
                <div className="text-[11px] text-brand-text-secondary mt-0.5">{monthClaimed.length} jobs</div>
              </div>
            </div>

            {weekClaimed.length > 0 && (
              <>
                <h3 className="font-display text-lg font-bold mb-2">This Week</h3>
                <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
                  {weekClaimed.map(job => (
                    <div key={job.id} className="flex justify-between text-xs py-1.5 border-b border-brand-muted last:border-0">
                      <span className="text-brand-text-secondary">{getDayLabel(job.job_date)} — {job.title}</span>
                      <span className="font-semibold">{formatMoney(job.pay_amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
