import { useState } from 'react'
import { TheFlow } from './components/TheFlow'
import { AdminPanel } from './components/AdminPanel'
import { useApps } from './hooks/useApps'
import './App.css'

function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const {
    apps,
    loading,
    deviceId,
    savedAppIds,
    addApp,
    updateApp,
    removeApp,
    incrementLike,
    toggleSave
  } = useApps()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader">✦</div>
        <p>Loading Pirasa...</p>
      </div>
    );
  }

  return (
    <div className="app-root">
      <TheFlow
        apps={apps}
        deviceId={deviceId}
        savedAppIds={savedAppIds}
        onOpenAdmin={() => setAdminOpen(true)}
        onIncrementLike={incrementLike}
        onToggleSave={toggleSave}
        onAddSite={addApp}
      />
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
