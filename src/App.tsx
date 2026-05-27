import { useState, useEffect } from 'react'
import { useStore } from './store'
import Header from './components/Header'
import TabBar from './components/TabBar'
import SuiviTab from './tabs/SuiviTab'
import JourTab from './tabs/JourTab'
import BlocsTab from './tabs/BlocsTab'
import HistoTab from './tabs/HistoTab'
import ReglTab from './tabs/ReglTab'

export type Tab = 'suivi' | 'jour' | 'blocs' | 'histo' | 'regl'

export default function App() {
  const [tab, setTab] = useState<Tab>('suivi')
  const [now, setNow] = useState(Date.now())
  const store = useStore()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-full w-full max-w-md mx-auto flex flex-col bg-gray-50 shadow-2xl">
      <Header store={store} now={now} />
      <main className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'suivi' && <SuiviTab store={store} now={now} />}
        {tab === 'jour'  && <JourTab  store={store} now={now} />}
        {tab === 'blocs' && <BlocsTab store={store} now={now} />}
        {tab === 'histo' && <HistoTab store={store} />}
        {tab === 'regl'  && <ReglTab  store={store} />}
      </main>
      <TabBar tab={tab} setTab={setTab} />
    </div>
  )
}
