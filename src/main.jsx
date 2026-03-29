import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom' // 👈 BrowserRouter에서 변경
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <React.StrictMode>
      <HashRouter> {/* 👈 여기도 변경 */}
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </HashRouter>
    </React.StrictMode>
  </AppErrorBoundary>
)
