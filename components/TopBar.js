'use client'

export default function TopBar({ title, subtitle, initials, onLogout }) {
  return (
    <div className="bg-brand-navy px-5 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center text-base">🧹</div>
        <div>
          <h1 className="font-display text-white text-base font-bold tracking-tight">{title || 'SMC Job Board'}</h1>
          {subtitle && <div className="text-[10px] text-white/50 font-medium tracking-wider uppercase">{subtitle}</div>}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="w-9 h-9 bg-brand-teal rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20"
        title="Logout"
      >
        {initials || '?'}
      </button>
    </div>
  )
}
