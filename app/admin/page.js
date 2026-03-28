'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import Tabs from '@/components/Tabs'
import JobCard from '@/components/JobCard'
import Toast, { showToast } from '@/components/Toast'
import { formatMoney, formatTime, formatDate, getDayLabel, generateWhatsAppJobText, todayStr, weekStartStr, jobTypeLabels } from '@/lib/utils'

export default function AdminPage() {
  const router = useRouter()
  const [worker, setWorker] = useState(null)
  const [tab, setTab] = useState('jobs')
  const [stats, setStats] = useState({})
  const [jobs, setJobs] = useState([])
  const [workers, setWorkers] = useState([])
  const [allWorkers, setAllWorkers] = useState([])
  const [pendingWorkers, setPendingWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewJob, setShowNewJob] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [editingWorker, setEditingWorker] = useState(null)
  const [assigningJob, setAssigningJob] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showAllWorkers, setShowAllWorkers] = useState(false)
  const [newJob, setNewJob] = useState({
    title: '', location_address: '', location_city: '', job_date: todayStr(),
    start_time: '11:00', duration_hours: 4, pay_amount: '', job_type: 'airbnb',
    urgency: 'today', notes: '', workers_needed: 1,
  })

  useEffect(() => {
    const stored = localStorage.getItem('smc_worker')
    if (!stored) { router.replace('/login'); return }
    const w = JSON.parse(stored)
    if (!w.is_admin) { router.replace('/worker'); return }
    setWorker(w)
  }, [router])

  const fetchAll = useCallback(async () => {
    if (!worker) return
    setLoading(true)
    try {
      const [statsRes, jobsRes, approvedRes, pendingRes, allWorkersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch(`/api/jobs?from=${weekStartStr()}`),
        fetch('/api/workers?status=approved'),
        fetch('/api/workers?status=pending'),
        fetch('/api/workers?all=true'),
      ])
      setStats(await statsRes.json())
      const jobsData = await jobsRes.json()
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      const approvedData = await approvedRes.json()
      setWorkers(Array.isArray(approvedData) ? approvedData : [])
      const pendingData = await pendingRes.json()
      setPendingWorkers(Array.isArray(pendingData) ? pendingData : [])
      const allData = await allWorkersRes.json()
      setAllWorkers(Array.isArray(allData) ? allData : [])
    } catch {}
    setLoading(false)
  }, [worker])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ===================== JOB ACTIONS =====================

  async function postJob(e) {
    e.preventDefault()
    if (!newJob.title || !newJob.pay_amount) { showToast('Title and pay required', 'error'); return }
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newJob, pay_amount: parseFloat(newJob.pay_amount), posted_by: worker.id })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error, 'error'); return }
      showToast('✓ Job posted!', 'success')
      setShowNewJob(false)
      setNewJob({ title: '', location_address: '', location_city: '', job_date: todayStr(), start_time: '11:00', duration_hours: 4, pay_amount: '', job_type: 'airbnb', urgency: 'today', notes: '', workers_needed: 1 })
      const appUrl = window.location.origin
      const waText = generateWhatsAppJobText(data, `${appUrl}/worker`)
      window.open(`https://wa.me/?text=${waText}`, '_blank')
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  async function updateJob(id, updates) {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      if (!res.ok) { const d = await res.json(); showToast(d.error, 'error'); return }
      showToast('✓ Job updated', 'success')
      setEditingJob(null)
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  async function deleteJob(id) {
    try {
      const res = await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Delete failed', 'error'); return }
      showToast('Job deleted', 'success')
      setConfirmDelete(null)
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  // ===================== WORKER ACTIONS =====================

  async function approveWorker(id, name) {
    try {
      await fetch('/api/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' })
      })
      showToast(`✓ ${name} approved!`, 'success')
      fetchAll()
    } catch { showToast('Error', 'error') }
  }

  async function denyWorker(id) {
    try {
      await fetch('/api/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'denied' })
      })
      showToast('Worker denied', 'error')
      fetchAll()
    } catch {}
  }

  async function updateWorker(id, updates) {
    try {
      const res = await fetch('/api/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      if (!res.ok) { const d = await res.json(); showToast(d.error, 'error'); return }
      showToast('✓ Worker updated', 'success')
      setEditingWorker(null)
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  async function deleteWorker(id) {
    try {
      const res = await fetch(`/api/workers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Delete failed', 'error'); return }
      showToast('Worker removed', 'success')
      setConfirmDelete(null)
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  // ===================== CLAIM ACTIONS =====================

  async function removeClaim(claimId) {
    try {
      const res = await fetch(`/api/claims?id=${claimId}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Failed to remove claim', 'error'); return }
      showToast('Claim removed', 'success')
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  async function updateClaim(claimId, updates) {
    try {
      const res = await fetch('/api/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: claimId, ...updates })
      })
      if (!res.ok) { showToast('Update failed', 'error'); return }
      showToast('✓ Claim updated', 'success')
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  async function forceAssign(jobId, workerId) {
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, worker_id: workerId, force: true })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error, 'error'); return }
      showToast('✓ Worker assigned!', 'success')
      setAssigningJob(null)
      fetchAll()
    } catch { showToast('Connection error', 'error') }
  }

  function logout() {
    localStorage.removeItem('smc_worker')
    router.replace('/login')
  }

  if (!worker) return null

  const initials = worker.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const today = todayStr()
  const openJobs = jobs.filter(j => j.status === 'open')
  const filledToday = jobs.filter(j => j.status === 'filled' && j.job_date === today)
  const completedJobs = jobs.filter(j => j.status === 'completed')
  const cancelledJobs = jobs.filter(j => j.status === 'cancelled')
  const todayJobs = jobs.filter(j => j.job_date === today)

  // Schedule: group by date
  const schedByDate = {}
  jobs.forEach(j => {
    if (!schedByDate[j.job_date]) schedByDate[j.job_date] = []
    schedByDate[j.job_date].push(j)
  })
  const sortedDates = Object.keys(schedByDate).sort()

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const expLabels = { none: 'No experience', less_than_1yr: '<1 year', '1_to_3yr': '1-3 years', '3_plus_yr': '3+ years' }
  const statusColors = {
    approved: 'bg-brand-green-bg text-brand-green',
    pending: 'bg-brand-gold-bg text-brand-gold',
    denied: 'bg-brand-red-bg text-brand-red',
    inactive: 'bg-gray-100 text-gray-500',
  }

  const adminTabs = [
    { id: 'jobs', icon: '📋', label: 'Jobs' },
    { id: 'team', icon: '👥', label: 'Team', badge: pendingWorkers.length },
    { id: 'schedule', icon: '📅', label: 'Schedule' },
    { id: 'pay', icon: '💰', label: 'Pay' },
  ]

  // ===================== JOB FORM (shared between new + edit) =====================
  function JobForm({ data, setData, onSubmit, onCancel, submitLabel }) {
    return (
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Job Title / Location</label>
          <input type="text" value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="e.g. Airbnb — 394 Lafayette, Passaic" className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">City</label>
          <input type="text" value={data.location_city || ''} onChange={e => setData({...data, location_city: e.target.value})} placeholder="e.g. Passaic" className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={data.job_date} onChange={e => setData({...data, job_date: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Time</label>
            <input type="time" value={data.start_time} onChange={e => setData({...data, start_time: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Duration</label>
            <select value={data.duration_hours} onChange={e => setData({...data, duration_hours: parseFloat(e.target.value)})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
              <option value={2}>2 hours</option><option value={3}>3 hours</option><option value={4}>4 hours</option><option value={5}>5 hours</option><option value={8}>Full day</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Pay ($)</label>
            <input type="number" value={data.pay_amount} onChange={e => setData({...data, pay_amount: e.target.value})} placeholder="125" className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Type</label>
            <select value={data.job_type} onChange={e => setData({...data, job_type: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
              <option value="airbnb">Airbnb Turnover</option><option value="deep_clean">Deep Clean</option><option value="commercial">Commercial</option><option value="restaurant">Restaurant</option><option value="residential">Residential</option><option value="common_area">Common Area</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Urgency</label>
            <select value={data.urgency} onChange={e => setData({...data, urgency: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
              <option value="urgent">Urgent</option><option value="today">Today / Tomorrow</option><option value="flexible">Flexible</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Notes for Worker</label>
          <textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} placeholder="e.g. 3BR/2BA, bring vacuum, key under mat..." className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal min-h-[80px] resize-y" />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Workers Needed</label>
          <select value={data.workers_needed} onChange={e => setData({...data, workers_needed: parseInt(e.target.value)})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
            <option value={1}>1 worker</option><option value={2}>2 workers</option><option value={3}>3 workers</option><option value={4}>4 workers</option><option value={5}>5 workers</option>
          </select>
        </div>
        {editingJob && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Status</label>
            <select value={data.status || 'open'} onChange={e => setData({...data, status: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
              <option value="open">Open</option><option value="filled">Filled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
        <button type="submit" className="w-full py-3.5 bg-brand-teal text-white font-bold text-sm rounded-btn mb-2.5">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="w-full py-2.5 text-brand-teal font-semibold text-xs rounded-btn border-2 border-brand-teal bg-transparent">Cancel</button>
      </form>
    )
  }

  // ===================== RENDER =====================

  return (
    <div className="min-h-screen bg-brand-bg">
      <Toast />
      <TopBar title="SMC Job Board" subtitle="Admin Godmode" initials={initials} onLogout={logout} />
      <Tabs tabs={adminTabs} activeTab={tab} onChange={setTab} />

      <div className="px-4 pt-4 pb-24">
        {/* ===== JOBS TAB ===== */}
        {tab === 'jobs' && (
          <>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">Open Jobs</div>
                <div className="font-display text-2xl font-bold text-brand-gold">{stats.openJobs || openJobs.length}</div>
              </div>
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">Filled Today</div>
                <div className="font-display text-2xl font-bold text-brand-green">{stats.filledToday || filledToday.length}</div>
              </div>
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">This Week</div>
                <div className="font-display text-2xl font-bold">{stats.weekJobs || jobs.length}</div>
              </div>
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">Claim Rate</div>
                <div className="font-display text-2xl font-bold text-brand-teal">{stats.claimRate || 0}%</div>
              </div>
            </div>

            {/* Open Jobs */}
            {openJobs.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold mb-3">Open Jobs <span className="bg-brand-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{openJobs.length}</span></h2>
                {openJobs.map(job => (
                  <div key={job.id} className="mb-3">
                    <JobCard job={job} />
                    <div className="flex gap-1.5 mt-[-8px] mb-3 px-1">
                      <button onClick={() => setEditingJob({...job, pay_amount: job.pay_amount.toString()})} className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-1.5 rounded-md">Edit</button>
                      <button onClick={() => setAssigningJob(job)} className="text-[10px] font-bold text-brand-navy bg-brand-navy/10 px-2.5 py-1.5 rounded-md">Assign</button>
                      <button onClick={() => updateJob(job.id, { status: 'completed' })} className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-2.5 py-1.5 rounded-md">Complete</button>
                      <button onClick={() => updateJob(job.id, { status: 'cancelled' })} className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1.5 rounded-md">Cancel</button>
                      <button onClick={() => setConfirmDelete({ type: 'job', id: job.id, name: job.title })} className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-md">Delete</button>
                    </div>
                    {/* Show claims with remove buttons */}
                    {job.claims?.length > 0 && (
                      <div className="px-1 mb-2">
                        {job.claims.map(claim => (
                          <div key={claim.id} className="flex items-center justify-between bg-white border border-brand-border rounded-lg px-3 py-2 mb-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{claim.workers?.full_name || 'Worker'}</span>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                claim.status === 'claimed' ? 'bg-brand-green-bg text-brand-green' :
                                claim.status === 'completed' ? 'bg-brand-teal/10 text-brand-teal' :
                                claim.status === 'no_show' ? 'bg-brand-red-bg text-brand-red' :
                                'bg-gray-100 text-gray-500'
                              }`}>{claim.status}</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => updateClaim(claim.id, { status: 'completed' })} className="text-[9px] font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded">Done</button>
                              <button onClick={() => updateClaim(claim.id, { status: 'no_show' })} className="text-[9px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded">No-show</button>
                              <button onClick={() => removeClaim(claim.id)} className="text-[9px] font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Filled Today */}
            {filledToday.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold mt-5 mb-3">Filled Today</h2>
                {filledToday.map(job => (
                  <div key={job.id} className="mb-3">
                    <JobCard job={job} />
                    <div className="flex gap-1.5 mt-[-8px] mb-3 px-1">
                      <button onClick={() => setEditingJob({...job, pay_amount: job.pay_amount.toString()})} className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-1.5 rounded-md">Edit</button>
                      <button onClick={() => setAssigningJob(job)} className="text-[10px] font-bold text-brand-navy bg-brand-navy/10 px-2.5 py-1.5 rounded-md">Assign</button>
                      <button onClick={() => updateJob(job.id, { status: 'completed' })} className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-2.5 py-1.5 rounded-md">Complete</button>
                      <button onClick={() => updateJob(job.id, { status: 'open' })} className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1.5 rounded-md">Reopen</button>
                      <button onClick={() => setConfirmDelete({ type: 'job', id: job.id, name: job.title })} className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-md">Delete</button>
                    </div>
                    {job.claims?.length > 0 && (
                      <div className="px-1 mb-2">
                        {job.claims.map(claim => (
                          <div key={claim.id} className="flex items-center justify-between bg-white border border-brand-border rounded-lg px-3 py-2 mb-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{claim.workers?.full_name || 'Worker'}</span>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                claim.status === 'claimed' ? 'bg-brand-green-bg text-brand-green' :
                                claim.status === 'completed' ? 'bg-brand-teal/10 text-brand-teal' :
                                claim.status === 'no_show' ? 'bg-brand-red-bg text-brand-red' :
                                'bg-gray-100 text-gray-500'
                              }`}>{claim.status}</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => updateClaim(claim.id, { status: 'completed' })} className="text-[9px] font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded">Done</button>
                              <button onClick={() => updateClaim(claim.id, { status: 'no_show' })} className="text-[9px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded">No-show</button>
                              <button onClick={() => removeClaim(claim.id)} className="text-[9px] font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Completed Jobs */}
            {completedJobs.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold mt-5 mb-3">Completed <span className="bg-brand-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{completedJobs.length}</span></h2>
                {completedJobs.map(job => (
                  <div key={job.id} className="mb-3 opacity-70">
                    <JobCard job={job} />
                    <div className="flex gap-1.5 mt-[-8px] mb-3 px-1">
                      <button onClick={() => updateJob(job.id, { status: 'open' })} className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-1.5 rounded-md">Reopen</button>
                      <button onClick={() => setConfirmDelete({ type: 'job', id: job.id, name: job.title })} className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-md">Delete</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Cancelled Jobs */}
            {cancelledJobs.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold mt-5 mb-3">Cancelled <span className="bg-gray-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{cancelledJobs.length}</span></h2>
                {cancelledJobs.map(job => (
                  <div key={job.id} className="mb-3 opacity-50">
                    <JobCard job={job} />
                    <div className="flex gap-1.5 mt-[-8px] mb-3 px-1">
                      <button onClick={() => updateJob(job.id, { status: 'open' })} className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-1.5 rounded-md">Reopen</button>
                      <button onClick={() => setConfirmDelete({ type: 'job', id: job.id, name: job.title })} className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-md">Delete</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {!loading && jobs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm text-brand-text-secondary">No jobs yet this week. Tap + to post one!</p>
              </div>
            )}
          </>
        )}

        {/* ===== TEAM TAB ===== */}
        {tab === 'team' && (
          <>
            {/* Invite box */}
            <div className="bg-gradient-to-br from-brand-navy to-brand-navy-dark rounded-card p-5 mb-4 text-white">
              <h3 className="font-display text-base font-bold mb-1.5">📲 Invite a Worker</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-3">Share this link via WhatsApp. Workers sign up and you approve them.</p>
              <div className="flex items-center bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 gap-2 mb-2.5">
                <code className="text-[11px] text-white/80 flex-1 truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/signup</code>
                <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/signup`); showToast('Link copied!', 'info') }} className="bg-brand-teal text-white border-none px-3 py-1.5 rounded-md text-[11px] font-bold shrink-0">Copy</button>
              </div>
              <button
                onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`Hey! I want to add you to our SMC cleaning crew. 🧹\n\nTap this link to sign up:\n👉 ${window.location.origin}/signup\n\nFill out your info and I'll approve you!`)}`, '_blank') }}
                className="w-full py-2.5 bg-[#25d366] text-white font-bold text-xs rounded-btn"
              >📲 Share via WhatsApp</button>
            </div>

            {/* Pending approvals */}
            {pendingWorkers.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold mb-3">
                  Pending Approval <span className="bg-brand-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{pendingWorkers.length}</span>
                </h2>
                {pendingWorkers.map(w => (
                  <div key={w.id} className="bg-white border-[1.5px] border-brand-gold rounded-card p-4 mb-3 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {w.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{w.full_name}</div>
                          <div className="text-[11px] text-brand-text-secondary">Applied {new Date(w.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-gold bg-brand-gold-bg px-2.5 py-1 rounded-full">New</span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-brand-muted"><span className="text-brand-text-muted">Phone</span><span className="font-semibold">{w.phone}</span></div>
                      <div className="flex justify-between py-1 border-b border-brand-muted"><span className="text-brand-text-muted">Experience</span><span className="font-semibold">{expLabels[w.experience] || w.experience}</span></div>
                      <div className="flex justify-between py-1 border-b border-brand-muted items-center">
                        <span className="text-brand-text-muted">Available</span>
                        <div className="flex gap-1">
                          {dayLabels.map((d, i) => (
                            <span key={d} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${w.available_days?.[i] ? 'bg-brand-teal text-white' : 'bg-brand-muted text-brand-text-muted'}`}>{d}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between py-1 border-b border-brand-muted"><span className="text-brand-text-muted">Hours</span><span className="font-semibold">{formatTime(w.earliest_start)} – {formatTime(w.latest_end)}</span></div>
                      <div className="flex justify-between py-1"><span className="text-brand-text-muted">Areas</span><span className="font-semibold">{w.areas?.join(', ') || 'Not specified'}</span></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => approveWorker(w.id, w.full_name?.split(' ')[0])} className="bg-brand-green text-white px-4 py-2.5 rounded-lg text-xs font-bold">✓ Approve</button>
                      <button onClick={() => denyWorker(w.id)} className="bg-transparent text-brand-red border-[1.5px] border-brand-red px-4 py-2.5 rounded-lg text-xs font-bold">✗ Deny</button>
                      <button onClick={() => setConfirmDelete({ type: 'worker', id: w.id, name: w.full_name })} className="bg-transparent text-gray-400 border-[1.5px] border-gray-300 px-4 py-2.5 rounded-lg text-xs font-bold ml-auto">Delete</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Active team */}
            <h2 className="font-display text-xl font-bold mt-5 mb-3">
              Active Team <span className="bg-brand-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{workers.length}</span>
            </h2>
            <div className="bg-white border border-brand-border rounded-card shadow-sm">
              {workers.map((w, i) => {
                const avColors = { available: 'bg-brand-green-bg text-brand-green', unavailable: 'bg-brand-red-bg text-brand-red', partial: 'bg-brand-gold-bg text-brand-gold' }
                const avLabels = { available: 'Available', unavailable: 'Off', partial: w.today_available_note || 'Partial' }
                return (
                  <div key={w.id} className={`px-4 py-3.5 ${i < workers.length - 1 ? 'border-b border-brand-muted' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-teal rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {w.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {w.full_name}
                          {w.is_admin && <span className="text-[8px] font-bold bg-brand-navy text-white px-1.5 py-0.5 rounded">ADMIN</span>}
                        </div>
                        <div className="text-[11px] text-brand-text-secondary truncate">
                          {w.phone} · {w.last_active ? `Active ${new Date(w.last_active).toLocaleDateString()}` : 'No activity'}
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${avColors[w.today_available] || avColors.available}`}>
                        {avLabels[w.today_available] || 'Available'}
                      </span>
                    </div>
                    {/* Godmode controls for each worker */}
                    <div className="flex gap-1.5 mt-2 ml-[52px]">
                      <button onClick={() => setEditingWorker(w)} className="text-[9px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-1 rounded">Edit</button>
                      {!w.is_admin && (
                        <button onClick={() => updateWorker(w.id, { is_admin: true })} className="text-[9px] font-bold text-brand-navy bg-brand-navy/10 px-2 py-1 rounded">Make Admin</button>
                      )}
                      {w.is_admin && w.id !== worker.id && (
                        <button onClick={() => updateWorker(w.id, { is_admin: false })} className="text-[9px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded">Remove Admin</button>
                      )}
                      <button onClick={() => updateWorker(w.id, { status: 'inactive' })} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Deactivate</button>
                      {w.id !== worker.id && (
                        <button onClick={() => setConfirmDelete({ type: 'worker', id: w.id, name: w.full_name })} className="text-[9px] font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded">Delete</button>
                      )}
                    </div>
                  </div>
                )
              })}
              {workers.length === 0 && (
                <div className="text-center py-8 text-sm text-brand-text-muted">No active workers yet</div>
              )}
            </div>

            {/* Toggle: show all workers (denied, inactive) */}
            <button onClick={() => setShowAllWorkers(!showAllWorkers)} className="mt-4 text-xs font-semibold text-brand-teal underline">
              {showAllWorkers ? 'Hide' : 'Show'} denied &amp; inactive workers ({allWorkers.filter(w => w.status === 'denied' || w.status === 'inactive').length})
            </button>

            {showAllWorkers && (
              <div className="bg-white border border-brand-border rounded-card shadow-sm mt-3">
                {allWorkers.filter(w => w.status === 'denied' || w.status === 'inactive').map((w, i, arr) => (
                  <div key={w.id} className={`px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-brand-muted' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {w.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-500">{w.full_name}</div>
                        <div className="text-[11px] text-brand-text-secondary">{w.phone}</div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[w.status]}`}>{w.status}</span>
                    </div>
                    <div className="flex gap-1.5 mt-2 ml-[52px]">
                      <button onClick={() => updateWorker(w.id, { status: 'approved' })} className="text-[9px] font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded">Reactivate</button>
                      <button onClick={() => setConfirmDelete({ type: 'worker', id: w.id, name: w.full_name })} className="text-[9px] font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded">Delete Forever</button>
                    </div>
                  </div>
                ))}
                {allWorkers.filter(w => w.status === 'denied' || w.status === 'inactive').length === 0 && (
                  <div className="text-center py-6 text-sm text-brand-text-muted">None</div>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== SCHEDULE TAB ===== */}
        {tab === 'schedule' && (
          <>
            <h2 className="font-display text-xl font-bold mb-3">This Week</h2>
            {sortedDates.length === 0 ? (
              <div className="text-center py-12 text-sm text-brand-text-muted">No jobs scheduled</div>
            ) : (
              sortedDates.map(date => (
                <div key={date}>
                  <div className="text-[11px] font-bold text-brand-teal uppercase tracking-wider py-3 border-b border-brand-muted mb-2">
                    {getDayLabel(date)} — {formatDate(date)}
                  </div>
                  {schedByDate[date].map(job => (
                    <div key={job.id} className="flex items-start gap-3 py-2.5 border-b border-brand-muted last:border-0">
                      <div className="text-xs text-brand-teal font-semibold w-[60px] shrink-0 pt-0.5">{formatTime(job.start_time)}</div>
                      <div className="flex-1">
                        <div className={`font-semibold text-[13px] ${job.status === 'open' ? 'text-brand-gold' : job.status === 'cancelled' ? 'text-gray-400 line-through' : ''}`}>
                          {job.status === 'open' ? '⚠ ' : job.status === 'cancelled' ? '✗ ' : job.status === 'completed' ? '✓ ' : ''}{job.title}
                        </div>
                        <div className="text-[11px] text-brand-text-secondary">{job.location_city || job.location_address || ''} · {formatMoney(job.pay_amount)}</div>
                        {job.claims?.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.claims.map(c => (
                              <span key={c.id} className={`text-[10px] px-2 py-0.5 rounded-full ${
                                c.status === 'completed' ? 'bg-brand-green-bg text-brand-green' :
                                c.status === 'no_show' ? 'bg-brand-red-bg text-brand-red' :
                                'bg-brand-muted text-brand-text-secondary'
                              }`}>{c.workers?.full_name || 'Worker'} {c.status !== 'claimed' ? `(${c.status})` : ''}</span>
                            ))}
                          </div>
                        ) : (
                          job.status !== 'cancelled' && <span className="text-[10px] bg-brand-gold-bg text-brand-gold px-2 py-0.5 rounded-full mt-1 inline-block">Unassigned</span>
                        )}
                        {/* Quick actions in schedule */}
                        <div className="flex gap-1 mt-1.5">
                          {job.status === 'open' && <button onClick={() => setAssigningJob(job)} className="text-[9px] font-bold text-brand-navy bg-brand-navy/10 px-2 py-0.5 rounded">Assign</button>}
                          {(job.status === 'open' || job.status === 'filled') && <button onClick={() => updateJob(job.id, { status: 'completed' })} className="text-[9px] font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">Complete</button>}
                          {job.status !== 'cancelled' && <button onClick={() => updateJob(job.id, { status: 'cancelled' })} className="text-[9px] font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded">Cancel</button>}
                          {job.status === 'cancelled' && <button onClick={() => updateJob(job.id, { status: 'open' })} className="text-[9px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded">Reopen</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {/* ===== PAY TAB ===== */}
        {tab === 'pay' && (
          <>
            <h2 className="font-display text-xl font-bold mb-1">Pay Summary</h2>
            <p className="text-xs text-brand-text-secondary mb-4">Week of {formatDate(weekStartStr())}</p>

            {stats.payByWorker && Object.entries(stats.payByWorker).map(([wid, w]) => (
              <div key={wid} className="bg-white border border-brand-border rounded-card p-4 mb-2.5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-[15px]">{w.name}</div>
                  <div className="font-display text-xl font-bold text-brand-teal">{formatMoney(w.total)}</div>
                </div>
                <div className="text-xs text-brand-text-secondary">
                  {w.jobs} jobs · {w.details?.map(d => d.title).join(' · ')}
                </div>
              </div>
            ))}

            {stats.weeklyLabor > 0 && (
              <div className="bg-brand-muted rounded-btn p-3.5 mt-4">
                <div className="flex justify-between text-[13px] font-semibold">
                  <span>Total Labor This Week</span>
                  <span className="font-display text-lg text-brand-teal">{formatMoney(stats.weeklyLabor)}</span>
                </div>
              </div>
            )}

            {(!stats.payByWorker || Object.keys(stats.payByWorker).length === 0) && (
              <div className="text-center py-12 text-sm text-brand-text-muted">No pay data for this week yet</div>
            )}
          </>
        )}
      </div>

      {/* FAB - Post New Job */}
      {tab === 'jobs' && (
        <button onClick={() => setShowNewJob(true)} className="fixed bottom-6 right-[calc(50%-190px)] w-14 h-14 rounded-full bg-brand-teal text-white text-3xl shadow-lg flex items-center justify-center z-50 active:scale-90 transition-all" style={{maxWidth: '420px'}}>
          +
        </button>
      )}

      {/* ===== NEW JOB MODAL ===== */}
      {showNewJob && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) setShowNewJob(false) }}>
          <div className="bg-brand-bg rounded-t-[20px] w-full max-w-[420px] max-h-[90vh] overflow-y-auto p-5 pb-10 animate-slide-up">
            <div className="w-9 h-1 bg-brand-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-[22px] font-bold mb-4">Post New Job</h2>
            <JobForm
              data={newJob}
              setData={setNewJob}
              onSubmit={postJob}
              onCancel={() => setShowNewJob(false)}
              submitLabel="📲 Post & Share via WhatsApp"
            />
          </div>
        </div>
      )}

      {/* ===== EDIT JOB MODAL ===== */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) setEditingJob(null) }}>
          <div className="bg-brand-bg rounded-t-[20px] w-full max-w-[420px] max-h-[90vh] overflow-y-auto p-5 pb-10 animate-slide-up">
            <div className="w-9 h-1 bg-brand-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-[22px] font-bold mb-4">Edit Job</h2>
            <JobForm
              data={editingJob}
              setData={setEditingJob}
              onSubmit={(e) => {
                e.preventDefault()
                const { id, claims, created_at, posted_by, workers_claimed, ...updates } = editingJob
                updates.pay_amount = parseFloat(updates.pay_amount)
                updateJob(id, updates)
              }}
              onCancel={() => setEditingJob(null)}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* ===== EDIT WORKER MODAL ===== */}
      {editingWorker && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) setEditingWorker(null) }}>
          <div className="bg-brand-bg rounded-t-[20px] w-full max-w-[420px] max-h-[90vh] overflow-y-auto p-5 pb-10 animate-slide-up">
            <div className="w-9 h-1 bg-brand-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-[22px] font-bold mb-4">Edit Worker</h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Name</label>
              <input type="text" value={editingWorker.full_name} onChange={e => setEditingWorker({...editingWorker, full_name: e.target.value})} className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Phone</label>
              <input type="text" value={editingWorker.phone} onChange={e => setEditingWorker({...editingWorker, phone: e.target.value})} className="w-full px-3.5 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Status</label>
              <select value={editingWorker.status} onChange={e => setEditingWorker({...editingWorker, status: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                <option value="approved">Approved</option><option value="pending">Pending</option><option value="denied">Denied</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Experience</label>
              <select value={editingWorker.experience} onChange={e => setEditingWorker({...editingWorker, experience: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                <option value="none">No experience</option><option value="less_than_1yr">Less than 1 year</option><option value="1_to_3yr">1-3 years</option><option value="3_plus_yr">3+ years</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Transportation</label>
              <select value={editingWorker.transportation} onChange={e => setEditingWorker({...editingWorker, transportation: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal bg-white">
                <option value="drives">Drives</option><option value="transit">Public transit</option><option value="none">No transportation</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Available Days</label>
              <div className="flex gap-1.5">
                {dayLabels.map((d, i) => (
                  <button key={d} type="button" onClick={() => {
                    const days = [...(editingWorker.available_days || [true,true,true,true,true,false,false])]
                    days[i] = !days[i]
                    setEditingWorker({...editingWorker, available_days: days})
                  }} className={`flex-1 text-[10px] font-bold py-2 rounded ${editingWorker.available_days?.[i] ? 'bg-brand-teal text-white' : 'bg-brand-muted text-brand-text-muted'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Earliest Start</label>
                <input type="time" value={editingWorker.earliest_start || '07:00'} onChange={e => setEditingWorker({...editingWorker, earliest_start: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Latest End</label>
                <input type="time" value={editingWorker.latest_end || '17:00'} onChange={e => setEditingWorker({...editingWorker, latest_end: e.target.value})} className="w-full px-3 py-3 border-[1.5px] border-brand-border rounded-btn text-sm focus:outline-none focus:border-brand-teal" />
              </div>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">Admin</label>
              <button type="button" onClick={() => setEditingWorker({...editingWorker, is_admin: !editingWorker.is_admin})} className={`w-12 h-6 rounded-full transition-colors relative ${editingWorker.is_admin ? 'bg-brand-teal' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${editingWorker.is_admin ? 'left-[26px]' : 'left-0.5'}`} />
              </button>
            </div>
            <button onClick={() => {
              const { id, created_at, approved_at, last_active, claims, ...updates } = editingWorker
              updateWorker(id, updates)
            }} className="w-full py-3.5 bg-brand-teal text-white font-bold text-sm rounded-btn mb-2.5">Save Changes</button>
            <button onClick={() => setEditingWorker(null)} className="w-full py-2.5 text-brand-teal font-semibold text-xs rounded-btn border-2 border-brand-teal bg-transparent">Cancel</button>
          </div>
        </div>
      )}

      {/* ===== FORCE ASSIGN MODAL ===== */}
      {assigningJob && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) setAssigningJob(null) }}>
          <div className="bg-brand-bg rounded-t-[20px] w-full max-w-[420px] max-h-[90vh] overflow-y-auto p-5 pb-10 animate-slide-up">
            <div className="w-9 h-1 bg-brand-border rounded-full mx-auto mb-4" />
            <h2 className="font-display text-[22px] font-bold mb-1">Assign Worker</h2>
            <p className="text-xs text-brand-text-secondary mb-4">to: {assigningJob.title}</p>

            {/* Already assigned */}
            {assigningJob.claims?.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider mb-2">Currently Assigned</div>
                {assigningJob.claims.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-brand-green-bg rounded-lg px-3 py-2 mb-1.5 text-xs">
                    <span className="font-semibold text-brand-green">✓ {c.workers?.full_name}</span>
                    <button onClick={() => removeClaim(c.id)} className="text-[9px] font-bold text-brand-red">Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider mb-2">Tap a worker to assign</div>
            <div className="space-y-1.5">
              {workers
                .filter(w => !assigningJob.claims?.some(c => c.worker_id === w.id))
                .map(w => (
                  <button key={w.id} onClick={() => forceAssign(assigningJob.id, w.id)} className="w-full flex items-center gap-3 bg-white border border-brand-border rounded-lg px-4 py-3 text-left hover:border-brand-teal transition-colors">
                    <div className="w-8 h-8 bg-brand-teal rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {w.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{w.full_name}</div>
                      <div className="text-[10px] text-brand-text-secondary">{w.phone}</div>
                    </div>
                  </button>
                ))
              }
              {workers.filter(w => !assigningJob.claims?.some(c => c.worker_id === w.id)).length === 0 && (
                <div className="text-center py-6 text-sm text-brand-text-muted">All workers already assigned</div>
              )}
            </div>
            <button onClick={() => setAssigningJob(null)} className="w-full mt-4 py-2.5 text-brand-teal font-semibold text-xs rounded-btn border-2 border-brand-teal bg-transparent">Close</button>
          </div>
        </div>
      )}

      {/* ===== CONFIRM DELETE MODAL ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center px-6" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}>
          <div className="bg-white rounded-card p-6 w-full max-w-[340px] shadow-xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="font-display text-lg font-bold">Delete {confirmDelete.type}?</h3>
              <p className="text-sm text-brand-text-secondary mt-1">&quot;{confirmDelete.name}&quot; will be permanently removed. This can&apos;t be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-brand-text-secondary font-semibold text-sm rounded-btn border-2 border-brand-border">Cancel</button>
              <button onClick={() => {
                if (confirmDelete.type === 'job') deleteJob(confirmDelete.id)
                else deleteWorker(confirmDelete.id)
              }} className="flex-1 py-2.5 bg-brand-red text-white font-bold text-sm rounded-btn">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
