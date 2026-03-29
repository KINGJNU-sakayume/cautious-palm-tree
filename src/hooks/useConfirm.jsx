import { useState, useRef } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export function useConfirm() {
  const [dialogState, setDialogState] = useState({ open: false, title: '', body: '' })
  const resolveRef = useRef(null)

  const confirm = (title, body) => {
    setDialogState({ open: true, title, body })
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }

  const handleConfirm = () => {
    setDialogState(s => ({ ...s, open: false }))
    resolveRef.current?.(true)
  }

  const handleCancel = () => {
    setDialogState(s => ({ ...s, open: false }))
    resolveRef.current?.(false)
  }

  const confirmDialog = (
    <ConfirmDialog
      open={dialogState.open}
      title={dialogState.title}
      body={dialogState.body}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirmDialog, confirm }
}
