'use client'
import { formatTime, formatMoney, formatDate, getDayLabel, jobTypeLabels, jobTypeIcons, calculateEndTime } from '@/lib/utils'

export default function JobCard({ job, showClaim, onClaim, claiming, workerView, claimed, lang }) {
  const urgencyMap = {
    urgent: { bg: 'bg-red-50', text: 'text-brand-red', label: 'Urgent' },
    today: { bg: 'bg-blue-50', text: 'text-brand-blue', label: getDayLabel(job.job_date) },
    flexible: { bg: 'bg-green-50', text: 'text-brand-green', label: 'Flexible' },
  }
  const urg = urgencyMap[job.urgency] || urgencyMap.today
  const endTime = calculateEndTime(job.start_time, job.duration_hours)
  const isFilled = job.status === 'filled'

  return (
    <div className={`bg-white border border-brand-border rounded-card p-4 mb-3 shadow-sm relative overflow-hidden transition-all ${isFilled && !workerView ? 'opacity-60' : ''}`}>
      {/* Urgency badge */}
      <div className={`absolute top-0 right-0 text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-lg rounded-tr-card ${urg.bg} ${urg.text}`}>
        {urg.label}
      </div>

      {/* Title */}
      <h3 className="font-bold text-[15px] pr-[70px] mb-1.5">{job.title}</h3>

      {/* Meta tags */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {job.location_city && (
          <span className="text-[11px] text-brand-text-secondary bg-brand-muted px-2 py-0.5 rounded-md">📍 {job.location_city}</span>
        )}
        <span className="text-[11px] text-brand-text-secondary bg-brand-muted px-2 py-0.5 rounded-md">
          🕐 {getDayLabel(job.job_date)} {formatTime(job.start_time)}–{formatTime(endTime)}
        </span>
        <span className="text-[11px] text-brand-text-secondary bg-brand-muted px-2 py-0.5 rounded-md">
          {jobTypeIcons[job.job_type] || '🧹'} {jobTypeLabels[job.job_type] || job.job_type}
        </span>
      </div>

      {/* Pay — hidden in worker listing view, revealed after claiming */}
      {workerView && !claimed ? (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm">🔒</span>
          <span className="text-xs text-brand-text-secondary italic">
            {lang === 'es' ? 'Toca Reclamar para ver el pago' : 'Tap Claim to see pay'}
          </span>
        </div>
      ) : (
        <div className="font-display text-lg font-bold text-brand-teal mb-2">{formatMoney(job.pay_amount)}</div>
      )}

      {/* Notes */}
      {job.notes && workerView && (
        <div className="text-[11px] text-brand-text-secondary mb-2.5">{job.notes}</div>
      )}

      {/* Status (admin view) */}
      {!workerView && (
        <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
          <div className={`w-2 h-2 rounded-full ${isFilled ? 'bg-brand-green' : 'bg-brand-gold'}`} />
          {isFilled
            ? `${job.workers_claimed} of ${job.workers_needed} filled`
            : `${job.workers_claimed} claimed · ${job.workers_needed - job.workers_claimed} needed`
          }
        </div>
      )}

      {/* Claimed workers (admin view) */}
      {!workerView && job.claims?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {job.claims.map(claim => (
            <span key={claim.id} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              claim.status === 'claimed' ? 'bg-brand-green-bg text-brand-green' : 'bg-brand-gold-bg text-brand-gold'
            }`}>
              {claim.status === 'claimed' ? '✓' : '⏳'} {claim.workers?.full_name || 'Worker'}
            </span>
          ))}
        </div>
      )}

      {/* Claim button (worker view) */}
      {showClaim && !claimed && (
        <button
          onClick={() => onClaim(job.id)}
          disabled={claiming}
          className="w-full mt-3 py-2.5 bg-brand-teal text-white font-bold text-sm rounded-btn transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {claiming
            ? (lang === 'es' ? 'Reclamando...' : 'Claiming...')
            : (lang === 'es' ? '🙋 Reclamar' : '🙋 Claim This Job')}
        </button>
      )}

      {/* Already claimed indicator */}
      {claimed && (
        <div className="w-full mt-3 py-2.5 bg-brand-green text-white font-bold text-sm rounded-btn text-center">
          ✓ Claimed!
        </div>
      )}
    </div>
  )
}
