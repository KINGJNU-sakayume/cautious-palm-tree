import React from 'react'
import { STORAGE_KEY } from '@/lib/localStore.js'

// Rendered outside every provider, so it reads storage directly.
function downloadRawData() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = '업적라이브러리-긴급백업.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ErrorFallback({ error }) {
  const hasData = (() => {
    try {
      return !!window.localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  })()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-paper px-6 text-center">
      <h1 className="text-xl font-bold text-ink">화면을 그리다 문제가 생겼어요</h1>
      <p className="mt-2 text-base text-ink-2 max-w-sm">
        새로고침하면 대부분 해결돼요. 기록은 브라우저에 그대로 남아 있어요.
      </p>
      <code className="mt-5 max-w-md w-full rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger break-all">
        {error?.message || '알 수 없는 오류'}
      </code>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
          새로고침
        </button>
        {hasData && (
          <button type="button" onClick={downloadRawData} className="btn btn-secondary">
            데이터 백업 받기
          </button>
        )}
      </div>
    </div>
  )
}
