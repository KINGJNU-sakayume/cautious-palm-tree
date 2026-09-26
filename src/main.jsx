import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { UIProvider } from './context/UIContext.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import './index.css'

// HashRouter: GitHub Pages has no server-side fallback for deep links.
ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <React.StrictMode>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AppProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </AppProvider>
        </ToastProvider>
      </HashRouter>
    </React.StrictMode>
  </AppErrorBoundary>,
)
