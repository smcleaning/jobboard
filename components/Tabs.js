'use client'

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex bg-white border-b border-brand-border overflow-x-auto no-scrollbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-3 px-1 text-center text-[10px] font-semibold border-b-[2.5px] transition-all min-w-[60px] relative
            ${activeTab === tab.id
              ? 'text-brand-teal border-brand-teal'
              : 'text-brand-text-muted border-transparent'
            }`}
        >
          <span className="text-base block mb-0.5">{tab.icon}</span>
          {tab.label}
          {tab.badge > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-18px)] w-2 h-2 bg-brand-red rounded-full border-2 border-white" />
          )}
        </button>
      ))}
    </div>
  )
}
