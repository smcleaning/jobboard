// Format currency
export function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

// Format time from "HH:MM" to "9:00 AM"
export function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`
}

// Format date
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Get relative day label
export function getDayLabel(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return formatDate(dateStr)
}

// Job type labels
export const jobTypeLabels = {
  airbnb: 'Airbnb Turnover',
  deep_clean: 'Deep Clean',
  commercial: 'Commercial',
  restaurant: 'Restaurant',
  residential: 'Residential',
  common_area: 'Common Area',
}

// Job type icons
export const jobTypeIcons = {
  airbnb: '🏠',
  deep_clean: '✨',
  commercial: '🏢',
  restaurant: '🍫',
  residential: '🏡',
  common_area: '🧹',
}

// Urgency styles
export const urgencyStyles = {
  urgent: { bg: 'bg-brand-red-bg', text: 'text-brand-red', label: 'Urgent' },
  today: { bg: 'bg-brand-blue-bg', text: 'text-brand-blue', label: 'Today' },
  flexible: { bg: 'bg-brand-green-bg', text: 'text-brand-green', label: 'Flexible' },
}

// Generate WhatsApp share text for a job
export function generateWhatsAppJobText(job, claimUrl) {
  const endTime = calculateEndTime(job.start_time, job.duration_hours)
  return encodeURIComponent(
    `🧹 *New Job Available!*\n\n` +
    `📍 *${job.title}*\n` +
    `🕐 ${formatDate(job.job_date)}, ${formatTime(job.start_time)} – ${formatTime(endTime)}\n` +
    `💰 ${formatMoney(job.pay_amount)} (${jobTypeLabels[job.job_type] || job.job_type})\n` +
    (job.notes ? `📝 ${job.notes}\n` : '') +
    `\n⚡ First to claim gets it!\n\n` +
    `👉 ${claimUrl}`
  )
}

// Calculate end time
export function calculateEndTime(startTime, durationHours) {
  const [h, m] = startTime.split(':').map(Number)
  const totalMinutes = h * 60 + m + durationHours * 60
  const endH = Math.floor(totalMinutes / 60) % 24
  const endM = totalMinutes % 60
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
}

// Normalize phone number (strip non-digits)
export function normalizePhone(phone) {
  return phone.replace(/\D/g, '').slice(-10)
}

// Get today's date as YYYY-MM-DD
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// Get start of current week (Monday)
export function weekStartStr() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

// Get start of current month
export function monthStartStr() {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`
}
