import { useState } from 'react'
import { TheFlow } from './components/TheFlow'
import { AdminPanel } from './components/AdminPanel'
import { MyPage } from './components/MyPage'
import { useApps } from './hooks/useApps'
import './App.css'

function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const [myPageOpen, setMyPageOpen] = useState(false)
  const { apps, addApp, updateApp, removeApp, isSaved, toggleSave } = useApps()

  return (
    <div className="app-root">
      <TheFlow
        apps={apps}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenMyPage={() => setMyPageOpen(true)}
        isSaved={isSaved}
        toggleSave={toggleSave}
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
      {myPageOpen && (
        <MyPage
          savedApps={apps.map((app, index) => ({ ...app, originalIndex: index }))
            .filter(app => isSaved(app.id))}
          onClose={() => setMyPageOpen(false)}
          onJump={(index) => {
            window.dispatchEvent(new CustomEvent('pirasa:jump', { detail: index }));
            setMyPageOpen(false);
          }}
        />
      )}
    </div>
  )
}

export default App
