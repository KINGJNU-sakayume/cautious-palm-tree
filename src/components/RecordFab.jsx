import React from 'react'
import { useUI } from '@/context/UIContext.jsx'
import { PlusIcon } from './Icons.jsx'

/** Floating "기록하기" button for phones, above the tab bar. */
export default function RecordFab({ categoryId = null }) {
  const { openRecordEditor } = useUI()
  return (
    <button
      type="button"
      onClick={() => openRecordEditor({ categoryId })}
      className="md:hidden fixed z-20 right-4 bottom-[calc(var(--tabbar-h)+16px+env(safe-area-inset-bottom))] h-14 pl-4 pr-5 rounded-2xl bg-accent text-accent-on shadow-pop flex items-center gap-2 text-base font-semibold active:bg-accent-strong"
    >
      <PlusIcon size={22} strokeWidth={2.2} />
      기록하기
    </button>
  )
}
