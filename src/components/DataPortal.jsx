import React, { useRef, useState } from 'react'
import { useApp } from '@/context/AppContext.jsx'

export default function DataPortal() {
  const { exportData, importData } = useApp()
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef(null)

  const handleExport = () => {
    try {
      exportData()
    } catch (e) {
      window.alert('내보내기 실패: ' + e.message)
    }
    setOpen(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
    setOpen(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result)
        if (!window.confirm('기존 데이터를 가져온 데이터로 덮어씁니다. 계속할까요?')) return
        importData(parsed)
      } catch (err) {
        window.alert('가져오기 실패: ' + (err.message || '파일을 읽을 수 없습니다'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="데이터 가져오기 / 내보내기"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <span className="text-base">💾</span>
        <span className="hidden sm:inline">데이터</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <span>📤</span>
              <span>내보내기 (JSON)</span>
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={handleImportClick}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <span>📥</span>
              <span>가져오기 (JSON)</span>
            </button>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
