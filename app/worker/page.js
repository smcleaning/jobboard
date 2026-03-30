'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import Tabs from '@/components/Tabs'
import Toast, { showToast } from '@/components/Toast'
import { formatMoney, formatPayRate, formatPayEstimate, formatTime, formatDate, getDayLabel, weekStartStr, todayStr, calculateEndTime, jobTypeIcons, jobTypeLabels, jobTypeLabelsEs } from '@/lib/utils'
import { translations } from '@/lib/i18n'

// ─── helper: day label in correct language ───────────────────────────────────
function dayLabelLang(dateStr, lang) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr + 'T12:00:00'); d.setHours(0,0,0,0)
  const diff = Math.round((d - today) / 86400000)
  if (diff === 0) return lang === 'es' ? 'Hoy' : 'Today'
  if (diff === 1) return lang === 'es' ? 'Mañana' : 'Tomorrow'
  return formatDate(dateStr)
}

// ─── Available job card (tap to see notes, claim button) ─────────────────────
function WorkerAvailableCard({ job, onClaim, claiming, lang, i }) {
  const [showNotes, setShowNotes] = React.useState(false)
  const endTime = calculateEndTime(job.start_time, job.duration_hours)
  const icon = jobTypeIcons[job.job_type] || '🧹'
  const typeLabel = lang === 'es' ? (jobTypeLabelsEs[job.job_type] || job.job_type) : (jobTypeLabels[job.job_type] || job.job_type)
  const day = dayLabelLang(job.job_date, lang)
  const urgencyConfig = {
    urgent: { strip: 'bg-red-500',   badge: 'bg-red-50 text-red-600',   label: lang==='es'?'Urgente':'Urgent' },
    today:  { strip: 'bg-brand-teal',badge: 'bg-teal-50 text-brand-teal',label: day },
    flexible:{ strip:'bg-brand-green',badge:'bg-green-50 text-brand-green',label: lang==='es'?'Flexible':'Flexible' },
  }
  const urg = urgencyConfig[job.urgency] || urgencyConfig.today

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border border-brand-border">
      <div className={`h-1 ${urg.strip}`} />
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] leading-snug">{job.title}</h3>
              <span className="text-[11px] text-brand-text-muted">{typeLabel}</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ml-2 shrink-0 ${urg.badge}`}>{urg.label}</span>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[12px] bg-brand-muted px-2.5 py-1 rounded-full font-medium text-brand-text-secondary">
            📅 {day} · {formatTime(job.start_time)}–{formatTime(endTime)}
          </span>
          {job.location_city && (
            <span className="text-[12px] bg-brand-muted px-2.5 py-1 rounded-full font-medium text-brand-text-secondary">
              📍 {job.location_city}
            </span>
          )}
          <span className="text-[12px] bg-brand-muted px-2.5 py-1 rounded-full font-medium text-brand-text-secondary">
            🕐 {job.duration_hours}h
          </span>
        </div>

        {/* Notes toggle */}
        {job.notes && (
          <>
            <button onClick={() => setShowNotes(v=>!v)} className="text-[12px] text-brand-teal font-semibold mb-1.5 flex items-center gap-1">
              <span>{showNotes ? '▲' : '▼'}</span>
              <span>{lang==='es' ? (showNotes?'Ocultar notas':'Ver notas') : (showNotes?'Hide notes':'View notes')}</span>
            </button>
            {showNotes && (
              <div className="bg-brand-muted rounded-xl px-3 py-2.5 mb-3 text-[12px] text-brand-text-secondary leading-relaxed">
                {job.notes}
              </div>
            )}
          </>
        )}

        {/* Hidden pay hint */}
        <div className="flex items-center gap-1.5 text-[12px] text-brand-text-muted italic mb-3">
          🔒 {i.hiddenPay}
        </div>

        {/* Claim button */}
        <button
          onClick={() => onClaim(job.id)}
          disabled={claiming}
          className="w-full py-3 bg-brand-teal text-white font-bold text-[14px] rounded-xl active:scale-[0.97] transition-all disabled:opacity-50"
        >
          {claiming
            ? (lang==='es' ? '⏳ Reclamando...' : '⏳ Claiming...')
            : (lang==='es' ? '🙋 Reclamar este trabajo' : '🙋 Claim This Job')}
        </button>
      </div>
    </div>
  )
}

// ─── Claimed job card (tap to expand details, checklist, access code) ─────────
function WorkerClaimedCard({ job, worker, i, lang }) {
  const [expanded, setExpanded] = React.useState(false)
  const endTime = calculateEndTime(job.start_time, job.duration_hours)
  const day = dayLabelLang(job.job_date, lang)
  const hasDetails = job.access_code || job.parking_notes || job.checklist?.length > 0 || job.notes

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border border-brand-border" style={{borderLeft:'4px solid #22c55e'}}>
      {/* Always-visible header — tap to expand */}
      <div className="p-4 cursor-pointer select-none" onClick={() => hasDetails && setExpanded(v=>!v)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{lang==='es'?'Reclamado':'Claimed'}</span>
              <h3 className="font-bold text-[14px] leading-snug truncate">{job.title}</h3>
            </div>
          </div>
          <div className="text-right ml-2 shrink-0">
            <div className="font-display text-xl font-bold text-green-600">{formatPayRate(job.pay_amount, job.pay_type)}</div>
            {formatPayEstimate(job.pay_amount, job.pay_type, job.duration_hours) && (
              <div className="text-[11px] text-green-500">{formatPayEstimate(job.pay_amount, job.pay_type, job.duration_hours)}</div>
            )}
            {hasDetails && <div className="text-[11px] text-brand-text-muted mt-0.5">{expanded ? '▲ '+(lang==='es'?'Ocultar':'Hide') : '▼ '+(lang==='es'?'Ver detalles':'Details')}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5 ml-[42px]">
          <span className="text-[11px] bg-brand-muted px-2.5 py-1 rounded-full text-brand-text-secondary font-medium">
            📅 {day} · {formatTime(job.start_time)}–{formatTime(endTime)}
          </span>
          {job.location_city && (
            <span className="text-[11px] bg-brand-muted px-2.5 py-1 rounded-full text-brand-text-secondary font-medium">
              📍 {job.location_city}
            </span>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {expanded && hasDetails && (
        <div className="border-t border-brand-muted px-4 pb-4 pt-3 space-y-3">
          {job.notes && (
            <div className="bg-brand-muted rounded-xl px-3 py-2.5 text-[12px] text-brand-text-secondary leading-relaxed">
              📝 {job.notes}
            </div>
          )}
          {(job.access_code || job.parking_notes) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 space-y-2.5">
              {job.access_code && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔑</span>
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">{i.accessCode}</p>
                    <p className="font-bold text-base text-amber-900">{job.access_code}</p>
                  </div>
                </div>
              )}
              {job.parking_notes && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">🅿️</span>
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">{i.parkingNotes}</p>
                    <p className="font-bold text-sm text-amber-900">{job.parking_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {job.checklist?.length > 0 && (
            <div className="bg-white border border-brand-border rounded-xl px-3 py-3">
              <ClaimedJobChecklist job={job} worker={worker} i={i} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ClaimedJobChecklist({ job, worker, i }) {
  const checkKey = `checklist_${job.id}_${worker.id}`
  const [checked, setChecked] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(checkKey) || '{}') } catch { return {} }
  })
  const allDone = job.checklist.every((_, idx) => checked[idx])
  function toggle(idx) {
    const next = { ...checked, [idx]: !checked[idx] }
    setChecked(next)
    try { localStorage.setItem(checkKey, JSON.stringify(next)) } catch {}
  }
  return (
    <div>
      <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2">{i.checklist}</p>
      {job.checklist.map((item, idx) => (
        <button key={idx} onClick={() => toggle(idx)} className="w-full flex items-center gap-2.5 py-2 border-b border-brand-muted last:border-0 text-left">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked[idx] ? 'bg-brand-green border-brand-green' : 'border-brand-border'}`}>
            {checked[idx] && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className={`text-sm ${checked[idx] ? 'line-through text-brand-text-muted' : 'text-brand-text'}`}>{item}</span>
        </button>
      ))}
      {allDone && (
        <div className="mt-2 text-center text-xs font-bold text-brand-green">🎉 {i.checklistDone}</div>
      )}
    </div>
  )
}

export default function WorkerPage() {
  const router = useRouter()
  const [worker, setWorker] = useState(null)
  const [tab, setTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [confirmJob, setConfirmJob] = useState(null)
  const [transport, setTransport] = useState(null)
  const [lang, setLang] = useState('en')

  const i = translations[lang] || translations.en

  useEffect(() => {
    const stored = localStorage.getItem('smc_worker')
    if (!stored) { router.replace('/login'); return }
    const w = JSON.parse(stored)
    if (w.is_admin) { router.replace('/admin'); return }
    if (w.status !== 'approved') { router.replace('/login'); return }
    setWorker(w)
    // Use worker's language preference, fallback to saved or 'en'
    const workerLang = w.language || localStorage.getItem('smc_lang') || 'es'
    setLang(workerLang)
  }, [router])

  function switchLang(l) {
    setLang(l)
    localStorage.setItem('smc_lang', l)
  }

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

  // Opens confirmation modal (called when worker taps "Reclamar" on a job card)
  function openConfirm(jobId) {
    const job = jobs.find(j => j.id === jobId)
    if (job) { setConfirmJob(job); setTransport(null) }
  }

  // Actually submits the claim (called from modal confirm button)
  async function claimJob(jobId) {
    if (!transport) { showToast(i.transportRequired, 'error'); return }
    setConfirmJob(null)
    setClaiming(jobId)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, worker_id: worker.id, transportation: transport })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || i.claimError, 'error'); return }
      showToast(i.claimSuccess, 'success')
      fetchJobs()
    } catch { showToast(i.connError, 'error') }
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
  const monthClaimed = claimedJobs
  const monthPay = monthClaimed.reduce((s, j) => s + Number(j.pay_amount), 0)

  const tabs = [
    { id: 'jobs', icon: '📋', label: i.tabJobs || 'Jobs' },
    { id: 'schedule', icon: '📅', label: i.tabWeek || 'My Week' },
    { id: 'pay', icon: '💰', label: i.tabPay || 'My Pay' },
  ]

  const availLabel = worker.today_available === 'available'
    ? i.available
    : worker.today_available === 'partial'
      ? i.partial
      : i.unavailable

  return (
    <div className="min-h-screen bg-brand-bg">
      <Toast />

      {/* Claim Confirmation Modal */}
      {confirmJob && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-brand-navy px-5 py-4">
              <p className="text-white font-bold text-base">{i.confirmTitle}</p>
              <p className="text-white/70 text-xs mt-0.5">{i.confirmQuestion}</p>
            </div>
            {/* Job details */}
            <div className="px-5 py-4 space-y-2.5">
              <div className="font-bold text-[15px]">{confirmJob.title}</div>
              <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                <span>📅</span>
                <span>{getDayLabel(confirmJob.job_date)}, {formatTime(confirmJob.start_time)} – {formatTime(calculateEndTime(confirmJob.start_time, confirmJob.duration_hours))}</span>
              </div>
              {confirmJob.location_city && (
                <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                  <span>📍</span>
                  <span>{confirmJob.location_city}</span>
                </div>
              )}
              {/* Pay revealed here */}
              <div className="flex items-center gap-2 bg-brand-green-bg rounded-xl px-4 py-3 mt-1">
                <span className="text-lg">💵</span>
                <div>
                  <p className="text-[11px] text-brand-text-secondary font-medium">{i.confirmPay}</p>
                  <p className="font-display text-2xl font-bold text-brand-green">{formatPayRate(confirmJob.pay_amount, confirmJob.pay_type)}</p>
                  {formatPayEstimate(confirmJob.pay_amount, confirmJob.pay_type, confirmJob.duration_hours) && (
                    <p className="text-[11px] text-brand-text-secondary">{formatPayEstimate(confirmJob.pay_amount, confirmJob.pay_type, confirmJob.duration_hours)}</p>
                  )}
                </div>
              </div>

              {/* Transportation selection */}
              <div className="mt-1">
                <p className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">{i.transportTitle}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransport('drives')}
                    className={`flex-1 py-2.5 rounded-btn text-sm font-semibold border-2 transition-all ${transport === 'drives' ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-brand-text-secondary border-brand-border'}`}
                  >{i.transportDrives}</button>
                  <button
                    onClick={() => setTransport('needs_ride')}
                    className={`flex-1 py-2.5 rounded-btn text-sm font-semibold border-2 transition-all ${transport === 'needs_ride' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-text-secondary border-brand-border'}`}
                  >{i.transportRide}</button>
                </div>
              </div>
            </div>
            {/* Buttons */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setConfirmJob(null)}
                className="flex-1 py-3 rounded-btn border border-brand-border text-brand-text-secondary font-semibold text-sm"
              >
                {i.cancelBtn}
              </button>
              <button
                onClick={() => claimJob(confirmJob.id)}
                className={`flex-1 py-3 rounded-btn font-bold text-sm active:scale-[0.97] transition-all ${transport ? 'bg-brand-teal text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                {i.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
      <TopBar
        title="SMC Job Board"
        subtitle={worker.full_name}
        initials={initials}
        onLogout={logout}
        rightExtra={
          <div className="flex gap-1 mr-2">
            <button onClick={() => switchLang('en')} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${lang === 'en' ? 'bg-brand-teal text-white' : 'bg-white/20 text-white/70'}`}>EN</button>
            <button onClick={() => switchLang('es')} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${lang === 'es' ? 'bg-brand-teal text-white' : 'bg-white/20 text-white/70'}`}>ES</button>
          </div>
        }
      />
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      <div className="px-4 pt-4 pb-24">
        {/* JOBS TAB */}
        {tab === 'jobs' && (
          <>
            <h2 className="font-display text-xl font-bold mb-3">{i.availableJobs}</h2>
            {loading ? (
              <div className="text-center py-8 text-sm text-brand-text-muted">{i.loading}</div>
            ) : openJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🧹</div>
                <p className="text-sm text-brand-text-secondary">{i.noOpenJobs}</p>
              </div>
            ) : (
              openJobs.map(job => (
                <WorkerAvailableCard key={job.id} job={job} onClaim={openConfirm} claiming={claiming === job.id} lang={lang} i={i} />
              ))
            )}

            {claimedJobs.length > 0 && (
              <>
                <h2 className="font-display text-xl font-bold mt-5 mb-3">{i.myClaimedJobs}</h2>
                {claimedJobs.map(job => (
                  <WorkerClaimedCard key={job.id} job={job} worker={worker} i={i} lang={lang} />
                ))}
              </>
            )}
          </>
        )}

        {/* SCHEDULE TAB */}
        {tab === 'schedule' && (
          <>
            <h2 className="font-display text-xl font-bold mb-3">{i.mySchedule}</h2>
            <div className="bg-brand-teal text-white rounded-btn p-3.5 mb-4 flex justify-between items-center">
              <div>
                <div className="text-[11px] opacity-70">{i.todayAvailability}</div>
                <div className="font-bold text-sm">
                  {availLabel}
                  {worker.today_available !== 'unavailable' && ` — ${formatTime(worker.earliest_start)} ${lang === 'es' ? 'a' : 'to'} ${formatTime(worker.latest_end)}`}
                </div>
              </div>
            </div>

            {sortedDates.length === 0 ? (
              <div className="text-center py-12 text-sm text-brand-text-muted">{i.noSchedule || i.noJobsScheduled}</div>
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
                      <div className="font-display text-sm font-bold text-brand-teal">{formatPayRate(job.pay_amount, job.pay_type)}</div>
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
            <h2 className="font-display text-xl font-bold mb-3">{i.myEarnings}</h2>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">{i.thisWeek}</div>
                <div className="font-display text-2xl font-bold text-brand-teal">{formatMoney(weekPay)}</div>
                <div className="text-[11px] text-brand-text-secondary mt-0.5">{weekClaimed.length} {i.jobs}</div>
              </div>
              <div className="bg-white border border-brand-border rounded-btn p-3.5 shadow-sm">
                <div className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold mb-1">{i.upcoming || i.thisMonth}</div>
                <div className="font-display text-2xl font-bold">{formatMoney(monthPay)}</div>
                <div className="text-[11px] text-brand-text-secondary mt-0.5">{monthClaimed.length} {i.jobs}</div>
              </div>
            </div>

            {weekClaimed.length > 0 && (
              <>
                <h3 className="font-display text-lg font-bold mb-2">{i.thisWeek}</h3>
                <div className="bg-white border border-brand-border rounded-card p-4 shadow-sm">
                  {weekClaimed.map(job => (
                    <div key={job.id} className="flex justify-between text-xs py-1.5 border-b border-brand-muted last:border-0">
                      <span className="text-brand-text-secondary">{getDayLabel(job.job_date)} — {job.title}</span>
                      <span className="font-semibold">{formatPayRate(job.pay_amount, job.pay_type)}</span>
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
