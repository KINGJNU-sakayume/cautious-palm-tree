import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import RecordHub from './pages/RecordHub.jsx'
import AchievementManagement from './pages/AchievementManagement.jsx'
import AchievementShowcase from './pages/AchievementShowcase.jsx'
import ToastStack from './components/ToastStack.jsx'
import DataPortal from './components/DataPortal.jsx'

const NAV_ITEMS = [
  { to: '/', label: '대시보드', icon: '🗂️' },
  { to: '/records', label: '기록 허브', icon: '📋' },
  { to: '/achievements', label: '업적', icon: '⚙️' },
  { to: '/showcase', label: '쇼케이스', icon: '🏆' },
]

function NavBar() {
  return (
    <nav className="h-12 flex-shrink-0 bg-white border-b border-slate-200 flex items-center px-3 gap-1 z-10">
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-3 sm:mr-6">
        <span className="text-base">🏆</span>
        <span className="font-extrabold text-slate-900 text-sm hidden sm:inline">업적 라이브러리</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            <span className="text-base">{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Data portal — right-aligned */}
      <div className="ml-auto flex-shrink-0">
        <DataPortal />
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
