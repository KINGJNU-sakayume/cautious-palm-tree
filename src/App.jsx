import React, { lazy, Suspense } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'

const Dashboard             = lazy(() => import('./pages/Dashboard.jsx'))
const RecordHub             = lazy(() => import('./pages/RecordHub.jsx'))
const AchievementManagement = lazy(() => import('./pages/AchievementManagement.jsx'))
const AchievementShowcase   = lazy(() => import('./pages/AchievementShowcase.jsx'))
import ToastStack from './components/ToastStack.jsx'
import { useApp } from './context/AppContext.jsx'
import { LayoutIcon, ClipboardIcon, SettingsIcon, TrophyIcon } from './components/Icons.jsx'

const NAV_ITEMS = [
  { to: '/', label: '대시보드', icon: LayoutIcon },
  { to: '/records', label: '기록 허브', icon: ClipboardIcon },
  { to: '/achievements', label: '업적', icon: SettingsIcon },
  { to: '/showcase', label: '쇼케이스', icon: TrophyIcon },
]

function NavBar() {
  return (
    <nav className="h-12 flex-shrink-0 bg-white border-b border-slate-200 flex items-center px-3 gap-1 z-10">
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-3 sm:mr-6">
        <TrophyIcon size={16} className="text-amber-500" />
        <span className="font-medium text-slate-900 text-sm hidden sm:inline">업적 라이브러리</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0">
        {NAV_ITEMS.map(item => {
          const IconComponent = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')
              }
            >
              <IconComponent size={16} />
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          )
        })}
      </div>

    </nav>
  )
}

export default function App() {
  const { loading, dbError } = useApp()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <NavBar />
      {dbError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs px-4 py-1.5">
          DB 연결 오류: {dbError}
        </div>
      )}
      <main className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            데이터 불러오는 중...
          </div>
        ) : (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              페이지 불러오는 중...
            </div>
          }>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/records" element={<RecordHub />} />
              <Route path="/achievements" element={<AchievementManagement />} />
              <Route path="/showcase" element={<AchievementShowcase />} />
            </Routes>
          </Suspense>
        )}
      </main>
      <ToastStack />
    </div>
  )
}
