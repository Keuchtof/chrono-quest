import type { Tab } from '../App'

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
}

const TABS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: 'suivi', label: 'Suivi',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      </svg>
    )
  },
  {
    id: 'jour', label: 'Jour',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )
  },
  {
    id: 'blocs', label: 'Blocs',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  },
  {
    id: 'histo', label: 'Histo.',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'regl', label: 'Régl.',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  },
]

export default function TabBar({ tab, setTab }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t border-gray-100 z-30">
      <div className="flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5"
          >
            {t.icon(tab === t.id)}
            <span className={`text-[10px] font-medium ${tab === t.id ? 'text-blue-500' : 'text-gray-400'}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
