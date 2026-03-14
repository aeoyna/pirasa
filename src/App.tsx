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
    decrementLike,
    toggleSave,
    userVotesMap
  } = useApps(user?.id)

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader">✦</div>
        <p>Loading Pirasa...</p>
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || '';

  return (
    <div className="app-root">
      <TheFlow
        apps={apps}
        deviceId={deviceId}
        savedAppIds={savedAppIds}
        userId={user?.id}
        userName={displayName}
        onOpenAdmin={() => setAdminOpen(true)}
        onIncrementLike={incrementLike}
        onDecrementLike={decrementLike}
        onToggleSave={toggleSave}
        onAddSite={addApp}
        onUpdateSite={updateApp}
        userVotesMap={userVotesMap}
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
