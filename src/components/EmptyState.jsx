import React from 'react'

export default function EmptyState({ icon = null, title, body = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center text-center px-6 py-10 ${className}`}>
      {icon && (
        <div className="mb-3 w-12 h-12 rounded-2xl bg-sunken text-ink-3 flex items-center justify-center">
          {icon}
        </div>
      )}
      <p className="text-md font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 text-sm text-ink-2 max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
