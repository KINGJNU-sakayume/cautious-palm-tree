import React from 'react'
import { useToast } from '@/context/ToastContext.jsx'
import ToastNotification from './ToastNotification.jsx'

export default function ToastStack() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification toast={toast} />
        </div>
      ))}
    </div>
  )
}
