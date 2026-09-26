import React, { useCallback, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

/**
 * const { confirm, confirmDialog } = useConfirm()
 * if (await confirm('기록을 삭제할까요?', '되돌릴 수 없어요.', { confirmLabel: '삭제' })) …
 * Render {confirmDialog} somewhere in the component.
 */
export function useConfirm() {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((title, body, options = {}) => new Promise(resolve => {
    resolverRef.current?.(false)
    resolverRef.current = resolve
    setDialog({ title, body, ...options })
  }), [])

  const close = (result) => {
    setDialog(null)
    resolverRef.current?.(result)
    resolverRef.current = null
  }

  const confirmDialog = dialog ? (
    <ConfirmDialog
      open
      title={dialog.title}
      body={dialog.body}
      confirmLabel={dialog.confirmLabel}
      tone={dialog.tone}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null

  return { confirm, confirmDialog }
}
