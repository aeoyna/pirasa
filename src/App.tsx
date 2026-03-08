import { useState } from 'react'
import { TheFlow } from './components/TheFlow'
import { AdminPanel } from './components/AdminPanel'
import { useApps } from './hooks/useApps'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const { user } = useAuth()
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
  } = useApps(user?.id)

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
        userId={user?.id}
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
