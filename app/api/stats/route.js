import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { todayStr, weekStartStr } from '@/lib/utils'

// GET /api/stats - Dashboard statistics
export async function GET() {
  const supabase = createServerClient()
  const today = todayStr()
  const weekStart = weekStartStr()

  // Open jobs
  const { count: openJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  // Filled today
  const { count: filledToday } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'filled')
    .eq('job_date', today)

  // Jobs this week
  const { count: weekJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('job_date', weekStart)

  // Claims this week for response rate
  const { data: weekJobsData } = await supabase
    .from('jobs')
    .select('id, workers_claimed, workers_needed')
    .gte('job_date', weekStart)

  const totalNeeded = weekJobsData?.reduce((s, j) => s + j.workers_needed, 0) || 1
  const totalClaimed = weekJobsData?.reduce((s, j) => s + j.workers_claimed, 0) || 0
  const claimRate = Math.round((totalClaimed / totalNeeded) * 100)

  // Pending workers
  const { count: pendingWorkers } = await supabase
    .from('workers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Active workers
  const { count: activeWorkers } = await supabase
    .from('workers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  // Weekly pay summary
  const { data: weekClaims } = await supabase
    .from('claims')
    .select('worker_id, workers(full_name), jobs(pay_amount, title, job_date)')
    .gte('jobs.job_date', weekStart)
    .eq('status', 'claimed')

  const payByWorker = {}
  weekClaims?.forEach(claim => {
    if (!claim.jobs) return
    const wid = claim.worker_id
    if (!payByWorker[wid]) {
      payByWorker[wid] = { name: claim.workers?.full_name || 'Unknown', total: 0, jobs: 0, details: [] }
    }
    payByWorker[wid].total += Number(claim.jobs.pay_amount)
    payByWorker[wid].jobs += 1
    payByWorker[wid].details.push({ title: claim.jobs.title, pay: Number(claim.jobs.pay_amount), date: claim.jobs.job_date })
  })

  const weeklyLabor = Object.values(payByWorker).reduce((s, w) => s + w.total, 0)

  return NextResponse.json({
    openJobs: openJobs || 0,
    filledToday: filledToday || 0,
    weekJobs: weekJobs || 0,
    claimRate,
    pendingWorkers: pendingWorkers || 0,
    activeWorkers: activeWorkers || 0,
    payByWorker,
    weeklyLabor,
  })
}
