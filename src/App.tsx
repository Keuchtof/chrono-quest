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
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col max-w-sm mx-auto relative">
      <Header store={store} now={now} />
      <main className="flex-1 overflow-y-auto pb-16">
        {tab === 'suivi' && <SuiviTab store={store} now={now} />}
        {tab === 'jour'  && <JourTab  store={store} now={now} />}
        {tab === 'blocs' && <BlocsTab store={store} />}
        {tab === 'histo' && <HistoTab store={store} />}
        {tab === 'regl'  && <ReglTab  store={store} />}
      </main>
      <TabBar tab={tab} setTab={setTab} />
    </div>
  )
}
