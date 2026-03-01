import { useState } from 'react'
import { TheFlow } from './components/TheFlow'
import { AdminPanel } from './components/AdminPanel'
import { useApps } from './hooks/useApps'
import './App.css'

function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const { apps, addApp, updateApp, removeApp } = useApps()

  return (
    <div className="app-root">
      <TheFlow apps={apps} onOpenAdmin={() => setAdminOpen(true)} />
      {adminOpen && (
        <AdminPanel
          apps={apps}
          onAdd={addApp}
          onUpdate={updateApp}
          onRemove={removeApp}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </div>
  )
}

export default App
