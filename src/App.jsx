import React from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import RecordHub from './pages/RecordHub.jsx'
import AchievementManagement from './pages/AchievementManagement.jsx'
import AchievementShowcase from './pages/AchievementShowcase.jsx'
import ToastStack from './components/ToastStack.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🗂️' },
  { to: '/records', label: 'Record Hub', icon: '📋' },
  { to: '/achievements', label: 'Achievements', icon: '⚙️' },
  { to: '/showcase', label: 'Showcase', icon: '🏆' },
]

function NavBar() {
  return (
    <nav className="h-12 flex-shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-1 z-10">
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-6">
        <span className="text-base">🏆</span>
        <span className="font-extrabold text-slate-900 text-sm">AchievementLib</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <NavBar />
      <main className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/records" element={<RecordHub />} />
          <Route path="/achievements" element={<AchievementManagement />} />
          <Route path="/showcase" element={<AchievementShowcase />} />
        </Routes>
      </main>
      <ToastStack />
    </div>
  )
}
