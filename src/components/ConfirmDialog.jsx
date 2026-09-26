import React from 'react'
import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = '확인',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onCancel} data-autofocus>
            취소
          </button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      }
    >
      {body && <p className="text-base text-ink-2 whitespace-pre-line">{body}</p>}
    </Modal>
  )
}
